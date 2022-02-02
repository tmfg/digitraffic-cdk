import * as DataDb from "../db/data";
import {DTDatabase, inDatabase, inDatabaseReadonly} from "digitraffic-common/database/database";
import {AutoriApi} from "../api/autori";
import moment from "moment";
import {Point} from "geojson";
import {ApiContractData, ApiOperationData, ApiRouteData} from "../model/data";
import {createHarjaId} from "./utils";
import {DbDomainContract, DbDomainTaskMapping, DbMaintenanceTracking, DbTextId, DbWorkMachine} from "../model/db-data";

export const UNKNOWN_TASK_NAME = 'UNKNOWN';

export class TrackingSaveResult {
    saved : number;
    errors : number;

    static createSaved(saved=1): TrackingSaveResult {
        return new TrackingSaveResult(saved, 0);
    }

    static createError(errors=1): TrackingSaveResult {
        return new TrackingSaveResult(0, errors);
    }

    constructor(saved: number, errors: number) {
        this.saved = saved;
        this.errors = errors;
    }

    sum(other: TrackingSaveResult): TrackingSaveResult {
        this.saved += other.saved;
        this.errors += other.errors;
        return this;
    }

    addSaved(savedToAdd=1) {
        this.saved += savedToAdd;
        return this;
    }

    addError(errorsToAdd=1) {
        this.errors += errorsToAdd;
        return this;
    }
}

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
        console.info(`method=updateContracts domain=${domainName} Insert return value: ${JSON.stringify(dbIds)}`);
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
        console.info(`method=updateTasks domain=${domainName} Insert return value: ${JSON.stringify(dbIds)}`);
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
            const contracts: DbDomainContract[] = await inDatabaseReadonly( (db: DTDatabase) => {
                return DataDb.getContractsWithSource(db, domainName);
            });
            // console.info(`method=updateTrackingsForDomain domain=${domainName} contracts: ${JSON.stringify(contracts)}`);

            const taskMappings: DbDomainTaskMapping[] = await inDatabaseReadonly((db: DTDatabase) => {
                return DataDb.getTaskMappings(db, domainName);
            });
            // console.info(`method=updateTrackingsForDomain taskMappings: ${JSON.stringify(taskMappings)}`);

            return Promise.allSettled(contracts.map((contract: DbDomainContract) => {
                // console.info(`method=updateTrackingsForDomain for domain=${domainName} contract=${contract.contract}`);
                const start = this.resolveContractLastUpdateTime( contract );
                return this.updateContracTrackings(contract, taskMappings, start);
            })).then((results : PromiseSettledResult<TrackingSaveResult>[]) => {
                const saved = results.reduce((acc, result) => acc + (result.status === 'fulfilled' ? result.value.saved : 0), 0);
                const errors = results.reduce((acc, result) => acc + (result.status === 'fulfilled' ? result.value.errors : 1), 0);
                console.info(`method=updateTrackingsForDomain domain=${domainName} count=${saved} errors=${errors} tookMs=${Date.now()-timerStart}`);
                return new TrackingSaveResult(saved,errors);
            });
        } catch (error) {
            console.error(`method=updateTrackings domain=${domainName} Failed for all contracts`, error);
            throw error;
        }
    }

    getLatestUpdatedDateForRouteData(routeData: ApiRouteData[]) : Date {
        try {
            const maxEpochMs = Math.max.apply(null, routeData.map(value => {
                return new Date(value.updated).getTime();
            }));
            return new Date(maxEpochMs);
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    private saveTrackingsToDb(contract: DbDomainContract, routeDatas: ApiRouteData[], taskMappings: DbDomainTaskMapping[]) : Promise<TrackingSaveResult> {
        const start = Date.now();

        return inDatabase((db: DTDatabase) => {
            return Promise.allSettled(routeDatas.map(async (routeData: ApiRouteData) => {

                try {
                    const machineId = await db.tx(tx => {
                        const workMachine: DbWorkMachine = this.createDbWorkMachine(contract.contract, routeData.vehicleType, contract.domain);
                        return DataDb.upsertWorkMachine(tx, workMachine);
                    });
                    console.info(`method=saveTrackingsToDb upsertWorkMachine with id ${machineId.id}`);

                    const tasks: string[] = this.getTasksForOperations(routeData.operations, taskMappings);
                    const data: DbMaintenanceTracking[] = this.createDbMaintenanceTracking(machineId.id, routeData, contract, tasks);
                    console.info(`method=saveTrackingsToDb inserting ${data.length} trackings for machine ${machineId.id}`);
                    return await db.tx(async tx => {
                        await DataDb.upsertMaintenanceTracking(tx, data);
                        await DataDb.updateContractLastUpdated(tx, contract.domain, contract.contract, routeData.updated);
                    }).then(() => {
                        console.info(`method=saveTrackingsToDb upsertMaintenanceTracking count ${data.length} done`);
                        return TrackingSaveResult.createSaved();
                    }).catch((error) => {
                        console.error('method=saveTrackingsToDb upsertMaintenanceTracking failed', error);
                        return TrackingSaveResult.createError();
                    });
                } catch (error) {
                    console.error(`method=saveTrackingsToDb failed for contract=${contract.contract} and domain=${contract.domain} for routeData ${routeData.id}`, error);
                    return TrackingSaveResult.createError();
                }
            })).then((results : PromiseSettledResult<TrackingSaveResult>[]) => {
                const saved = results.reduce((acc, result) => acc + (result.status === 'fulfilled' ? result.value.saved : 0), 0);
                const errors = results.reduce((acc, result) => acc + (result.status === 'fulfilled' ? result.value.errors : 1), 0);
                console.info(`method=saveTrackingsToDb domain=${contract.domain} contract=${contract.contract} count=${saved} errors=${errors} tookMs=${Date.now()-start}`);
                return new TrackingSaveResult(saved, errors);
            });
        });
    }

    resolveContractLastUpdateTime(contract: DbDomainContract) : Date {
        if (contract.data_last_updated) {
            console.info(`method=resolveContractLastUpdateTime contract=${contract.contract} and domain=${contract.domain} using contract.data_last_updated ${contract.data_last_updated.toISOString()}`);
            return contract.data_last_updated;
        } else if (contract.start_date) {
            console.info(`method=resolveContractLastUpdateTime contract=${contract.contract} and domain=${contract.domain} using contract.start_date ${contract.start_date.toISOString()}`);
            return contract.start_date;
        }
        // Fallback one week to past from now
        const result = moment().subtract(7, 'days').toDate();
        console.info(`method=resolveContractLastUpdateTime contract=${contract.contract} and domain=${contract.domain} using -7, 'days' ${result.toLocaleString()}`);
        return result;
    }

    createDbMaintenanceTracking(workMachineId: number, routeData: ApiRouteData, contract: DbDomainContract, harjaTasks: string[]): DbMaintenanceTracking[] {

        if (harjaTasks.length === 0) {
            console.info(`method=createDbMaintenanceTracking No tasks for tracking api id ${routeData.id} -> no data to save`);
            return [];
        }

        return routeData.geography.features.map((f) => {

            let lastPoint = undefined;
            let lineString = undefined;

            if (f.geometry.type == "Point") {
                lastPoint = JSON.stringify(f.geometry);
            } else if (f.geometry.type == "LineString") {
                lastPoint = JSON.stringify({
                    type: "Point",
                    coordinates: f.geometry.coordinates[f.geometry.coordinates.length - 1],
                } as Point);
                lineString = JSON.stringify(f.geometry);
            }
            return {
                direction: undefined,
                sending_time: routeData.created,
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
            } as DbMaintenanceTracking;
        });
    }

    createDbWorkMachine(contractId: string, vehicleType: string, domainName: string): DbWorkMachine {
        return {
            harjaUrakkaId: createHarjaId(contractId),
            harjaId: createHarjaId(vehicleType),
            type: `domainName: ${domainName} / contractId: ${contractId} / vehicleType: ${vehicleType}`,
        };
    }

    createDbDomainContracts(contracts: ApiContractData[], domainName: string): DbDomainContract[] {
        return contracts.map(contract => ({
            domain: domainName,
            contract: contract.id,
            name: contract.name,
            start_date: contract.startDate,
            end_date: contract.endDate,
            data_last_updated: undefined,
            source: undefined,
        }));
    }

    createDbDomainTaskMappings(operations: ApiOperationData[], domainName: string): DbDomainTaskMapping[] {
        return operations.map(operation => ({
            name: UNKNOWN_TASK_NAME,
            original_id: operation.id,
            domain: domainName,
            ignore: true,
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
            if (taskMapping) {
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
    private updateContracTrackings(contract: DbDomainContract, taskMappings : DbDomainTaskMapping[], apiDataUpdatedFrom: Date) : Promise<TrackingSaveResult> {
        console.info(`method=updateContracTrackings domain=${contract.domain} contract=${contract.contract} getNextRouteDataForContract from ${apiDataUpdatedFrom.toISOString()}`);
        // routeData = await this.api.getNextRouteDataForContract(contract.contract, start, 24);
        console.debug(`method=updateContracTrackings going to call getNextRouteDataForContract(${contract.contract}, ${apiDataUpdatedFrom.toISOString()}, 24)`);
        return this.api.getNextRouteDataForContract(contract.contract, apiDataUpdatedFrom, 24)
            .then(this.saveContracRoutesAsTrackings(contract, taskMappings, apiDataUpdatedFrom))
            .catch((error) => {
                console.error(`method=updateContracTrackings Error ${error}`);
                return TrackingSaveResult.createError();
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
                console.info(`method=saveContracRoutesAsTrackings No new data for contract=${contract.contract} after ${apiDataUpdatedFrom.toISOString()}`);
                return Promise.resolve(new TrackingSaveResult(0,0));
            }

            return this.saveTrackingsToDb(contract, routeData, taskMappings)
                .then((result: TrackingSaveResult) => {
                    const latestUpdated = this.getLatestUpdatedDateForRouteData(routeData);
                    // console.info(`getLatestUpdatedDateForRouteData: domain=${contract.domain} contract=${contract.contract} ${start.toISOString()}`);
                    // Recursive call to update next route data after latestUpdated from api
                    return this.updateContracTrackings(contract, taskMappings, latestUpdated)
                        .then((nextResult: TrackingSaveResult) => {
                            return result.sum(nextResult);
                        }).catch((error) => {
                            console.error(`method=saveContracRoutesAsTrackings Error ${error}`);
                            return result.addError();
                        });
                }).catch((error) => {
                    console.error(`method=saveContracRoutesAsTrackings Error ${error}`);
                    return TrackingSaveResult.createError();
                });
        };
    }
}
