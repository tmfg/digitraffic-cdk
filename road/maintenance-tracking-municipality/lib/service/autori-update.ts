import * as DataDb from "../db/data";
import {DTDatabase, inDatabase, inDatabaseReadonly} from "digitraffic-common/database/database";
import {AutoriApi} from "../api/autori";
import moment from "moment";
import {Point} from "geojson";
import {
    ApiContractData,
    ApiOperationData,
    ApiRouteData,
    DbMaintenanceTracking,
    DbDomainContract, DbDomainTaskMapping,
    DbWorkMachine, DbTextId,
} from "../model/data";
import {createHarjaId} from "./utils";

const UNKNOWN_TASK_NAME = 'UNKNOWN';

export interface TrackingSaveResult {
    errors : number,
    saved : number,
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

        const dbIds: DbTextId[] = await inDatabase(async (db: DTDatabase) => {
            return await DataDb.upsertContracts(db, dbContracts);
        });
        console.info(`method=updateContracts domain=${domainName} Insert return value: ${JSON.stringify(dbIds)}`);
        // Returns array [{"id":89},null,null,{"id":90}] -> nulls are conflicting ones not inserted
        return dbIds.filter(id => id != null).length;
    }

    /**
     * Update tasks from remote api to db
     * @param username Basic auth username
     * @param password Basic auth password
     * @param endpointUrl Enpoint url ie https://mydomain.com
     * @param domainName Solution domain name ie. myprovider-helsinki
     * @return inserted count
     */
    // export async function updateTasks(username: string, password: string, endpointUrl: string, domainName: string): Promise<number> {
    async updateTasks(domainName: string): Promise<number> {

        // const api = new AutoriApi(username, password, endpointUrl);

        const apiOperations: ApiOperationData[] = await this.api.getOperations();
        const taskMappings: DbDomainTaskMapping[] = this.createDbDomainTaskMappings(apiOperations, domainName);

        const dbIds: DbTextId[] = await inDatabase(async (db: DTDatabase) => {
            return await DataDb.insertNewTasks(db, taskMappings);
        });
        console.info(`method=updateTasks domain=${domainName} Insert return value: ${JSON.stringify(dbIds)}`);
        // Returns array [{"original_id":89},null,null,{"original_id":90}] -> nulls are conflicting ones not inserted
        return dbIds.filter(dbId => dbId && dbId.id != null).length;
    }


    /**
     *
     * @param username Basic auth username
     * @param password Basic auth password
     * @param endpointUrl Enpoint url ie https://mydomain.com
     * @param domainName Solution domain name ie. myprovider-helsinki
     */
    // export async function updateData(username: string, password: string, endpointUrl: string, domainName: string): Promise<TrackingSaveResult> {
    async updateTrackings(domainName: string): Promise<TrackingSaveResult> {

        let saved = 0;
        let errors = 0;

        try {
            const contracts: DbDomainContract[] = await inDatabaseReadonly(async (db: DTDatabase) => {
                return await DataDb.getContractsWithSource(domainName, db);
            });
            console.info(`methood=updateTrackings domain=${domainName} contracts: ${JSON.stringify(contracts)}`);

            const taskMappings: DbDomainTaskMapping[] = await inDatabaseReadonly(async (db: DTDatabase) => {
                return await DataDb.getTaskMappings(domainName, db);
            });

            console.info(`methood=updateTrackings taskMappings: ${JSON.stringify(taskMappings)}`);

            await Promise.allSettled(contracts.map(async (contract: DbDomainContract) => {
                console.info(`method=updateTrackings for domain=${domainName} contract=${contract.contract}`);

                let start = this.resolveContractLastUpdateTime( contract );
                console.info(`resolveContractLastUpdateTime: domain=${domainName} contract=${contract.contract} ${start.toISOString()}`);
                let routeData: ApiRouteData[] = [];
                do {
                    console.info(`methood=updateTrackings domain=${domainName} contract=${contract.contract} getNextRouteDataForContract from ${start.toISOString()}`);
                    routeData = await this.api.getNextRouteDataForContract(contract.contract, start, 24);
                    console.info(`routeData.length ${routeData.length}`);
                    if (routeData.length > 0) {
                        const  result = await this.updateRoutes(contract, routeData, taskMappings);
                        saved += result.saved;
                        errors += result.errors;
                        start = this.getLatestUpdatedDateForRouteData(routeData);
                        console.info(`getLatestUpdatedDateForRouteData: domain=${domainName} contract=${contract.contract} ${start.toISOString()}`);
                    } else {
                        console.info(`methood=updateTrackings No new data for contract=${contract} after ${start.toISOString()}`);
                    }

                } while (routeData.length > 0);
            }));

        } catch (error) {
            errors++;
            console.error(`method=updateTrackings domain=${domainName} Failed for all contracts`, error);
            throw error;
        }

        const result = {
            errors,
            saved,
        } as TrackingSaveResult;

        console.info(`method=updateTrackings result ${JSON.stringify(result)}`);
        return result;
    }

    getLatestUpdatedDateForRouteData(routeData: ApiRouteData[]) : Date {
        try {
            const maxEpochMs = Math.max.apply(null, routeData.map(value => {
                console.info(`value.updated ${value.updated}`);
                return new Date(value.updated).getTime();
            }));
            return new Date(maxEpochMs);
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    async updateRoutes(contract: DbDomainContract, routeData: ApiRouteData[], taskMappings: DbDomainTaskMapping[]) : Promise<TrackingSaveResult> {
        let saved = 0;
        let errors = 0;

        await inDatabase(async (db: DTDatabase) => {
            return await Promise.allSettled(routeData.map(async (routeData: ApiRouteData) => {

                try {
                    const machineId = await db.tx(async tx => {
                        const workMachine: DbWorkMachine = this.createDbWorkMachine(contract.contract, routeData.vehicleType, contract.domain);
                        return await DataDb.upsertWorkMachine(tx, workMachine);
                    });
                    console.info(`method=updateData upsertWorkMachine with id ${machineId.id}`);

                    const tasks: string[] = this.getTasksForOperations(routeData.operations, taskMappings);
                    const data: DbMaintenanceTracking[] = this.createDbMaintenanceTracking(machineId.id, routeData, contract, tasks);
                    console.info(`method=updateData inserting ${data.length} trackings for machine ${machineId.id}`);
                    return await db.tx(async tx => {
                        await DataDb.upsertMaintenanceTracking(tx, data);
                        await DataDb.updateContractLastUpdated(tx, contract.domain, contract.contract, routeData.updated);
                    }).then(() => {
                        saved++;
                        console.info(`method=updateData upsertMaintenanceTracking count ${data.length} done`);
                    }).catch((error) => {
                        errors++;
                        console.error('method=updateData upsertMaintenanceTracking failed', error);
                    });
                } catch (error) {
                    errors++;
                    console.error(`method=updateData failed for contract=${contract.contract} and domain=${contract.domain} for routeData ${routeData.id}`, error);
                }
            }));
        });
        return {
            errors,
            saved,
        } as TrackingSaveResult;
    }

    resolveContractLastUpdateTime(contract: DbDomainContract) : Date {
        if (contract.data_last_updated) {
            console.info(`method=resolveContractLastUpdateTime contract=${contract.contract} and domain=${contract.domain} using contract.data_last_updated ${contract.data_last_updated.toISOString()}`);
            return contract.data_last_updated;
        } else if (contract.start_date) {
            console.info(`method=resolveContractLastUpdateTime contract=${contract.contract} and domain=${contract.domain} using contract.start_date ${contract.start_date.toISOString()}`);
            return contract.start_date;
        }
        const result = moment().add(-7, 'days').toDate();
        console.info(`method=resolveContractLastUpdateTime contract=${contract.contract} and domain=${contract.domain} using -7, 'days' ${result.toLocaleString()}`);
        return result;
    }

    createDbMaintenanceTracking(workMachineId: number, routeData: ApiRouteData, contract: DbDomainContract, tasks: string[]): DbMaintenanceTracking[] {

        if (tasks.length == 0) {
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
                sendingTime: routeData.created,
                startTime: routeData.endTime,
                endTime: routeData.endTime,
                lastPoint: lastPoint,
                lineString: lineString,
                sendingSystem: contract.domain,
                workMachineId: workMachineId,
                tasks: tasks,
                domain: contract.domain,
                contract: contract.contract,
                municipalityMessageOriginalId: routeData.id,
                finished: true,
            } as DbMaintenanceTracking;
        });
    }

    createDbWorkMachine(contractId: string, vehicleType: string, domainName: string): DbWorkMachine {
        return {
            harjaUrakkaId: createHarjaId(contractId).valueOf(),
            harjaId: createHarjaId(vehicleType).valueOf(),
            type: `domainName: ${domainName} / contractId: ${contractId} / vehicleType: ${vehicleType}`,
        };
    }

    createDbDomainContracts(contracts: ApiContractData[], domainName: string): DbDomainContract[] {
        return contracts.map((contract) => {

            return {
                domain: domainName,
                contract: contract.id,
                name: contract.name,
                start_date: contract.startDate,
                end_date: contract.endDate,
                data_last_updated: undefined,
                source: undefined,
            } as DbDomainContract;
        });
    }

    createDbDomainTaskMappings(contracts: ApiOperationData[], domainName: string): DbDomainTaskMapping[] {
        return contracts.map((operation) => {
            return {
                name: UNKNOWN_TASK_NAME,
                original_id: operation.id,
                domain: domainName,
                ignore: true,
            } as DbDomainTaskMapping;
        });
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

        const tasks: string[] = operations.reduce(function (filtered: string[], operation) {
            const taskMapping = taskMappings.find((mapping: DbDomainTaskMapping): boolean => {
                return mapping.original_id == operation && !mapping.ignore;
            });
            if (taskMapping) {
                filtered.push(taskMapping.name);
            }
            return filtered;
        }, []);
        return tasks;
    }
}
