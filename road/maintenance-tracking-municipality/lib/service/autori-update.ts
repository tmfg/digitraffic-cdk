import * as DataDb from "../db/data";
import {DTDatabase, inDatabase, inDatabaseReadonly} from "digitraffic-common/database/database";
import {AutoriApi} from "../api/autori";
import moment from "moment";
import {ApiContractData, ApiOperationData, ApiRouteData} from "../model/autori-api-data";
import {createHarjaId} from "./utils";
import {DbDomainContract, DbDomainTaskMapping, DbMaintenanceTracking, DbTextId, DbWorkMachine} from "../model/db-data";
import {AUTORI_MAX_MINUTES_AT_ONCE, AUTORI_MAX_MINUTES_TO_HISTORY} from "../constants";
import {TrackingSaveResult, UNKNOWN_TASK_NAME} from "../model/service-data";
import {GeoJsonLineString, GeoJsonPoint} from "../../../../digitraffic-common/utils/geometry";
import * as CommonUpdateService from "./common-update";

export class AutoriUpdate {

    readonly api: AutoriApi;

    constructor(api: AutoriApi) {
        this.api = api;
    }

    /**
     * Update contracts from remote api to db
     * @param domainName Solution domain name ie. myprovider-helsinki
     * @return inserted count
     */
    async updateContracts(domainName: string): Promise<number> {

        const apiContracts: ApiContractData[] = await this.api.getContracts();
        const dbContracts: DbDomainContract[] = this.createDbDomainContracts(apiContracts, domainName);

        const dbIds: DbTextId[] = await inDatabase((db: DTDatabase) => {
            return DataDb.upsertContracts(db, dbContracts);
        });
        console.info(`method=AutoriUpdate.updateContracts domain=${domainName} Insert return value: ${JSON.stringify(dbIds)}`);
        // Returns array [{"id":89},null,null,{"id":90}] -> nulls are conflicting ones not inserted
        return dbIds.filter(id => id != null).length;
    }

    /**
     * Update tasks from remote api to db
     * @param domainName Solution domain name ie. myprovider-helsinki
     * @return inserted count
     */
    async updateTasks(domainName: string): Promise<number> {

        const apiOperations: ApiOperationData[] = await this.api.getOperations();
        const taskMappings: DbDomainTaskMapping[] = this.createDbDomainTaskMappings(apiOperations, domainName);

        const dbIds: DbTextId[] = await inDatabase((db: DTDatabase) => {
            return DataDb.insertNewTasks(db, taskMappings);
        });
        console.info(`method=AutoriUpdate.updateTasks domain=${domainName} Insert return value: ${JSON.stringify(dbIds)}`);
        // Returns array [{"original_id":89},null,null,{"original_id":90}] -> nulls are conflicting ones not inserted
        return dbIds.filter(dbId => dbId && dbId.id != null).length;
    }


    /**
     * @param domainName Solution domain name ie. myprovider-helsinki
     * @return TrackingSaveResult update result
     */
    async updateTrackingsForDomain(domainName: string): Promise<TrackingSaveResult> {

        const timerStart = Date.now();

        try {
            const contracts: DbDomainContract[] = await inDatabaseReadonly((db: DTDatabase) => {
                return DataDb.getContractsWithSource(db, domainName);
            });

            const taskMappings: DbDomainTaskMapping[] = await inDatabaseReadonly((db: DTDatabase) => {
                return DataDb.getTaskMappings(db, domainName);
            });

            return Promise.allSettled(contracts.map((contract: DbDomainContract) => {
                const start = this.resolveNextStartTimeForDataFetchFromHistory(contract);
                return this.updateContracTrackings(contract, taskMappings, start);
            })).then((results: PromiseSettledResult<TrackingSaveResult>[]) => {
                const summedResult = CommonUpdateService.sumResults(results);
                console.info(`method=AutoriUpdate.updateTrackingsForDomain domain=${domainName} count=${summedResult.saved} errors=${summedResult.errors} tookMs=${Date.now() - timerStart}`);
                return summedResult;
            }).then((finalResult) => {
                return CommonUpdateService.updateDataUpdated(finalResult);
            });
        } catch (error) {
            console.error(`method=AutoriUpdate.updateTrackings domain=${domainName} Failed for all contracts`, error);
            throw error;
        }
    }

    getLatestUpdatedDateForRouteData(routeData: ApiRouteData[]): Date {
        try {
            const maxEpochMs = Math.max.apply(null, routeData.map(value => {
                return new Date(value.updated || value.endTime).getTime();
            }));
            return new Date(maxEpochMs);
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    private saveTrackingsToDb(contract: DbDomainContract, routeDatas: ApiRouteData[], taskMappings: DbDomainTaskMapping[]): Promise<TrackingSaveResult> {
        const start = Date.now();

        return inDatabase((db: DTDatabase) => {
            return Promise.allSettled(routeDatas.map(async (routeData: ApiRouteData) => {

                // estimated message size
                const messageSizeBytes = Buffer.byteLength(JSON.stringify(routeData));

                try {
                    const machineId = await db.tx(tx => {
                        const workMachine: DbWorkMachine = this.createDbWorkMachine(contract.contract, contract.domain, routeData.vehicleType);
                        return DataDb.upsertWorkMachine(tx, workMachine);
                    });
                    console.debug(`DEBUG method=AutoriUpdate.saveTrackingsToDb upsertWorkMachine with id ${machineId.id}`);

                    const tasks: string[] = this.getTasksForOperations(routeData.operations, taskMappings);
                    const data: DbMaintenanceTracking[] = this.createDbMaintenanceTracking(machineId.id, routeData, contract, tasks);
                    console.debug(`DEBUG method=AutoriUpdate.saveTrackingsToDb inserting ${data.length} trackings for machine ${machineId.id}`);
                    return await db.tx(async tx => {
                        await DataDb.upsertMaintenanceTrackings(tx, data);
                        await DataDb.updateContractLastUpdated(tx, contract.domain, contract.contract, routeData.updated || routeData.endTime);
                    }).then(() => {
                        console.info(`method=AutoriUpdate.saveTrackingsToDb.upsert domain=${contract.domain} contract=${contract.contract} insertCount=${data.length} errors=0 total message sizeBytes=${messageSizeBytes} tookMs=${Date.now() - start}`);
                        return TrackingSaveResult.createSaved(messageSizeBytes, data.length);
                    }).catch((error) => {
                        console.error(`method=AutoriUpdate.saveTrackingsToDb.upsert domain=${contract.domain} contract=${contract.contract} insertCount=0 errors=1 total message sizeBytes=${messageSizeBytes} tookMs=${Date.now() - start}`, error);
                        return TrackingSaveResult.createError(messageSizeBytes);
                    });
                } catch (error) {
                    console.error(`method=AutoriUpdate.saveTrackingsToDb failed for contract=${contract.contract} and domain=${contract.domain} for routeData ${routeData.id}`, error);
                    return TrackingSaveResult.createError(messageSizeBytes);
                }
            })).then((results: PromiseSettledResult<TrackingSaveResult>[]) => {
                const summedResult = CommonUpdateService.sumResults(results);
                console.info(`method=AutoriUpdate.saveTrackingsToDb domain=${contract.domain} contract=${contract.contract} count=${summedResult.saved} errors=${summedResult.errors} total message sizeBytes=${summedResult.sizeBytes} tookMs=${Date.now() - start}`);
                return summedResult;
            });
        });
    }

    /**
     * Find out from what time the data should be retrieved from history
     * @param contract
     */
    resolveNextStartTimeForDataFetchFromHistory(contract: DbDomainContract): Date {
        // Allowed to get last 5 min data, no further history, use max 7 min to have no gaps in data
        const maxDate = moment().subtract(AUTORI_MAX_MINUTES_TO_HISTORY, 'minutes').toDate();

        let resolvedTime = moment().subtract(AUTORI_MAX_MINUTES_TO_HISTORY, 'minutes').toDate();
        if (contract.data_last_updated) {
            console.debug(`DEBUG method=AutoriUpdate.resolveContractLastUpdateTime contract=${contract.contract} and domain=${contract.domain} using contract.data_last_updated ${contract.data_last_updated.toISOString()}`);
            resolvedTime = contract.data_last_updated;
        } else if (contract.start_date) {
            console.debug(`DEBUG method=AutoriUpdate.resolveContractLastUpdateTime contract=${contract.contract} and domain=${contract.domain} using contract.start_date ${contract.start_date.toISOString()}`);
            resolvedTime = contract.start_date;
        } else {
            console.debug(`DEBUG method=AutoriUpdate.resolveContractLastUpdateTime contract=${contract.contract} and domain=${contract.domain} using -7, 'minutes' ${resolvedTime.toLocaleString()}`);
        }

        const result = new Date(Math.max(resolvedTime.getTime(), maxDate.getTime()));
        console.debug(`DEBUG method=AutoriUpdate.resolveContractLastUpdateTime resolvedTime=${resolvedTime.toISOString()} maxDate=${maxDate.toISOString()}  result=${result.toISOString()} `);
        return result;
    }

    createDbMaintenanceTracking(workMachineId: bigint, routeData: ApiRouteData, contract: DbDomainContract, harjaTasks: string[]): DbMaintenanceTracking[] {

        if (harjaTasks.length === 0) {
            console.info(`method=AutoriUpdate.createDbMaintenanceTracking domain=${contract.domain} contract=${contract.contract} No tasks for tracking api id ${routeData.id} -> no data to save`);
            return [];
        }

        if (!routeData.geography) {
            return [];
        }

        return routeData.geography.features.map((f) => {

            let lastPoint: GeoJsonPoint;
            let lineString: GeoJsonLineString | null = null;

            if (f.geometry.type == "Point") {
                lastPoint = new GeoJsonPoint(f.geometry.coordinates);
            } else if (f.geometry.type == "LineString") {
                lastPoint = new GeoJsonPoint(f.geometry.coordinates[f.geometry.coordinates.length - 1]);
                lineString = new GeoJsonLineString(f.geometry.coordinates);
            } else {
                throw new Error(`Unsupported geometry type for maintenance tracking ${f.geometry.type}`);
            }

            /* eslint-disable camelcase */
            return {
                direction: undefined,
                sending_time: routeData.created || new Date(),
                start_time: routeData.startTime,
                end_time: routeData.endTime,
                last_point: lastPoint,
                line_string: lineString,
                sending_system: contract.domain,
                work_machine_id: workMachineId,
                tasks: harjaTasks,
                domain: contract.domain,
                contract: contract.contract,
                message_original_id: routeData.id,
                finished: true,
            };
            /* eslint-enable camelcase */
        });
    }

    createDbWorkMachine(contractId: string, domainName: string, vehicleType?: string): DbWorkMachine {
        return {
            harjaUrakkaId: createHarjaId(contractId),
            harjaId: createHarjaId(vehicleType || 'dummy'),
            type: `domainName: ${domainName} / contractId: ${contractId} / vehicleType: ${vehicleType}`,
        };
    }

    createDbDomainContracts(contracts: ApiContractData[], domainName: string): DbDomainContract[] {
        return contracts.map(contract => (
            /* eslint-disable camelcase */
            {
                domain: domainName,
                contract: contract.id,
                name: contract.name,
                start_date: contract.startDate,
                end_date: contract.endDate,
                data_last_updated: undefined,
                source: undefined,
                /* eslint-enable camelcase */
            }));
    }

    createDbDomainTaskMappings(operations: ApiOperationData[], domainName: string): DbDomainTaskMapping[] {
        return operations.map(operation => (
            /* eslint-disable camelcase */
            {
                name: UNKNOWN_TASK_NAME,
                original_id: operation.id,
                domain: domainName,
                ignore: true,
                /* eslint-enable camelcase */
            }));
    }

    /**
     * Map domain route operations to Harja tasks
     * @param operations to map
     * @param taskMappings mapping of tasks from database
     */
    getTasksForOperations(operations: string[], taskMappings: DbDomainTaskMapping[]): string[] {
        if (operations === undefined) {
            return [];
        }

        return operations.reduce(function (filtered: string[], operation) {
            const taskMapping = taskMappings.find((mapping: DbDomainTaskMapping): boolean => {
                return mapping.original_id == operation && !mapping.ignore;
            });
            if (taskMapping && !filtered.includes(taskMapping.name)) {
                return filtered.concat(taskMapping.name);
            }
            return filtered;
        }, []);
    }

    /**
     * Function will get route data from api from given date and save it to db and recursively
     * call again the function with new date until no new data is available
     *
     * @param contract witch trackings to update
     * @param taskMappings mappings for api tasks -> harja tasks
     * @param apiDataUpdatedFrom exclusive start time where to start asking for new data from api
     * @private
     */
    private updateContracTrackings(contract: DbDomainContract, taskMappings: DbDomainTaskMapping[], apiDataUpdatedFrom: Date): Promise<TrackingSaveResult> {
        console.info(`method=AutoriUpdate.updateContracTrackings domain=${contract.domain} contract=${contract.contract} getNextRouteDataForContract from ${apiDataUpdatedFrom.toISOString()}`);
        // routeData = await this.api.getNextRouteDataForContract(contract.contract, start, 24);
        console.debug(`DEBUG method=AutoriUpdate.updateContracTrackings going to call getNextRouteDataForContract(${contract.contract}, ${apiDataUpdatedFrom.toISOString()}, 24)`);
        return this.api.getNextRouteDataForContract(contract, apiDataUpdatedFrom, AUTORI_MAX_MINUTES_AT_ONCE)
            .then(this.saveContracRoutesAsTrackings(contract, taskMappings, apiDataUpdatedFrom))
            .catch((error) => {
                console.error(`method=AutoriUpdate.updateContracTrackings Error ${error}`);
                return TrackingSaveResult.createError(0);
            });
    }

    /**
     * Method to update api routes to trackings
     * @param contract witch trackings to update
     * @param taskMappings mappings for api tasks -> harja tasks
     * @param apiDataUpdatedFrom exclusive start time where to start asking for new data from api
     * @private
     */
    private saveContracRoutesAsTrackings(contract: DbDomainContract, taskMappings: DbDomainTaskMapping[], apiDataUpdatedFrom: Date) {
        return (routeData: ApiRouteData[]): Promise<TrackingSaveResult> => {

            if (routeData.length === 0) {
                console.info(`method=AutoriUpdate.saveContracRoutesAsTrackings No new data for contract=${contract.contract} after ${apiDataUpdatedFrom.toISOString()}`);
                return Promise.resolve(new TrackingSaveResult(0, 0, 0));
            }

            // Estimated message size
            const messageSizeBytes = Buffer.byteLength(JSON.stringify(routeData));
            return this.saveTrackingsToDb(contract, routeData, taskMappings)
                .then((result: TrackingSaveResult) => {
                    const latestUpdated = this.getLatestUpdatedDateForRouteData(routeData);
                    // console.info(`getLatestUpdatedDateForRouteData: domain=${contract.domain} contract=${contract.contract} ${start.toISOString()}`);
                    // Recursive call to update next route data after latestUpdated from api
                    return this.updateContracTrackings(contract, taskMappings, latestUpdated)
                        .then((nextResult: TrackingSaveResult) => {
                            return result.sum(nextResult);
                        }).catch((error) => {
                            console.error(`method=AutoriUpdate.saveContracRoutesAsTrackings Error ${error}`);
                            return result.addError(messageSizeBytes);
                        });
                }).catch((error) => {
                    console.error(`method=AutoriUpdate.saveContracRoutesAsTrackings Error ${error}`);
                    return TrackingSaveResult.createError(messageSizeBytes);
                });
        };
    }
}
