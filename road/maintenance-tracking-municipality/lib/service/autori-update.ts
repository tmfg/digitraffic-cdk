import * as DataDb from "../dao/data";
import {DTDatabase, inDatabase, inDatabaseReadonly} from "digitraffic-common/database/database";
import {AutoriApi} from "../api/autori";
import moment from "moment";
import {ApiContractData, ApiOperationData, ApiRouteData} from "../model/autori-api-data";
import * as Utils from "./utils";
import {DbDomainContract, DbDomainTaskMapping, DbLatestTracking, DbMaintenanceTracking, DbNumberId, DbTextId, DbWorkMachine} from "../model/db-data";
import {TrackingSaveResult} from "../model/tracking-save-result";
import * as CommonUpdateService from "./common-update";
import * as AutoriUtils from "./autori-utils";
import {Position} from "geojson";

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
    async updateContractsForDomain(domainName: string): Promise<number> {

        const apiContracts: ApiContractData[] = await this.api.getContracts();
        const dbContracts: DbDomainContract[] = AutoriUtils.createDbDomainContracts(apiContracts, domainName);

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
    async updateTaskMappingsForDomain(domainName: string): Promise<number> {

        const apiOperations: ApiOperationData[] = await this.api.getOperations();
        const taskMappings: DbDomainTaskMapping[] = AutoriUtils.createDbDomainTaskMappings(apiOperations, domainName);

        const dbIds: DbTextId[] = await inDatabase((db: DTDatabase) => {
            return DataDb.upsertTaskMappings(db, taskMappings);
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
                const start = AutoriUtils.resolveNextStartTimeForDataFromApi(contract);
                return this.updateContractTrackings(contract, taskMappings, start);
            })).then((results: PromiseSettledResult<TrackingSaveResult>[]) => {
                const summedResult = CommonUpdateService.sumResultsFromPromises(results);
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

    /**
     * Function will get route data from api from given date and save it to db and recursively
     * call again the function with new date until no new data is available
     *
     * @param contract witch trackings to update
     * @param taskMappings mappings for api tasks -> harja tasks
     * @param apiDataUpdatedFrom exclusive start time where to start asking for new data from api
     * @private
     */
    private updateContractTrackings(contract: DbDomainContract, taskMappings: DbDomainTaskMapping[], apiDataUpdatedFrom: Date): Promise<TrackingSaveResult> {
        console.info(`method=AutoriUpdate.updateContractTrackings domain=${contract.domain} contract=${contract.contract} getNextRouteDataForContract from ${apiDataUpdatedFrom.toISOString()}`);
        return this.api.getNextRouteDataForContract(contract, apiDataUpdatedFrom, moment().add(1, 'minutes').toDate())
            .then(this.saveContractRouteDataAsTrackings(contract, taskMappings, apiDataUpdatedFrom))
            .catch((error) => {
                console.error(`method=AutoriUpdate.updateContractTrackings Error ${error}`);
                return TrackingSaveResult.createError(0);
            });
    }

    /**
     * Method to save api routes as trackings to db
     * @param contract witch trackings to update
     * @param taskMappings mappings for api tasks -> harja tasks
     * @param apiDataUpdatedFrom exclusive start time where to start asking for new data from api
     * @private
     */
    private saveContractRouteDataAsTrackings(contract: DbDomainContract, taskMappings: DbDomainTaskMapping[], apiDataUpdatedFrom: Date) {
        return (originalRouteData: ApiRouteData[]): Promise<TrackingSaveResult> => {
            const start = Date.now();

            const fixedRouteData: ApiRouteData[] = AutoriUtils.fixApiRouteDatas(originalRouteData);

            if (fixedRouteData.length === 0) {
                console.info(`method=AutoriUpdate.saveContractRouteDataAsTrackings No new data for domain=${contract.domain} contract=${contract.contract} after ${apiDataUpdatedFrom.toISOString()}`);
                return Promise.resolve(new TrackingSaveResult(0, 0, 0));
            }

            return inDatabase(async (db: DTDatabase) => {

                const saveResults: TrackingSaveResult[] = [];
                for (const routeData of fixedRouteData) {

                    const messageSizeBytes = Utils.countEstimatedSizeOfMessage(routeData);

                    try {
                        const machineId: DbNumberId = await db.tx(tx => {
                            const workMachine: DbWorkMachine = AutoriUtils.createDbWorkMachine(contract.contract, contract.domain, routeData.user, routeData.vehicleType);
                            return DataDb.upsertWorkMachine(tx, workMachine);
                        });
                        console.debug(`DEBUG method=AutoriUpdate.saveContractRouteDataAsTrackings upsertWorkMachine with id ${machineId.id}`);

                        const tasks: string[] = AutoriUtils.getTasksForOperations(routeData.operations, taskMappings);
                        const tracking: DbMaintenanceTracking|null = AutoriUtils.createDbMaintenanceTracking(machineId.id, routeData, contract, tasks);

                        const saveResult:TrackingSaveResult = tracking ?
                            await this.saveMaintenanceTrackingAndUpdatePrevious(
                                db, tracking, contract, machineId, messageSizeBytes, Utils.dateFromIsoString(routeData.updated ?? routeData.endTime),
                            ):
                            TrackingSaveResult.createSaved(messageSizeBytes,0);
                        saveResults.push(saveResult);
                    } catch (error) {
                        console.error(`method=AutoriUpdate.saveContractRouteDataAsTrackings failed for contract=${contract.contract} and domain=${contract.domain} for routeData ${routeData.id}`, error);
                        saveResults.push(TrackingSaveResult.createError(messageSizeBytes));
                    }
                }
                const summedResult = CommonUpdateService.sumResults(saveResults);
                console.info(`method=AutoriUpdate.saveContractRouteDataAsTrackings domain=${contract.domain} contract=${contract.contract} count=${summedResult.saved} errors=${summedResult.errors} total message sizeBytes=${summedResult.sizeBytes} tookMs=${Date.now() - start}`);
                return summedResult;
            });
        };
    }

    private async saveMaintenanceTrackingAndUpdatePrevious(
        db: DTDatabase, tracking: DbMaintenanceTracking, contract: DbDomainContract, machineId: DbNumberId, messageSizeBytes: number, lastUpdated: Date,
    ): Promise<TrackingSaveResult> {

        const start = Date.now();
        const previous: DbLatestTracking | null = await DataDb.findLatestNotFinishedTrackingForWorkMachine(db, contract.domain, machineId.id);

        if (previous) {
            console.info(`previous: ${JSON.stringify(previous)}\nnext: ${JSON.stringify(tracking)}`);
        }

        const trackingStartPosition: Position = Utils.getTrackingStartPoint(tracking);
        if (previous && AutoriUtils.isExtendingPreviousTracking(JSON.parse(previous.last_point).coordinates, trackingStartPosition, previous.end_time, tracking.start_time)) {
            await DataDb.markMaintenanceTrackingFinished(db, previous.id);
            // If the task are the same, then set reference to previous tracking id
            if (Utils.hasBothStringArraysSameValues(previous.tasks, tracking.tasks)) {
                // eslint-disable-next-line camelcase
                tracking.previous_tracking_id = previous.id;
            }
        }
        return db.tx(async tx => {
            await DataDb.insertMaintenanceTracking(tx, tracking);
            await DataDb.updateContractLastUpdated(tx, contract.domain, contract.contract, lastUpdated);
        }).then(() => {
            console.info(`method=AutoriUpdate.saveMaintenanceTrackingAndUpdatePrevious domain=${contract.domain} contract=${contract.contract} insertCount=1 errors=0 total message sizeBytes=${messageSizeBytes} tookMs=${Date.now() - start}`);
            return TrackingSaveResult.createSaved(messageSizeBytes);
        }).catch((error) => {
            console.error(`method=AutoriUpdate.saveMaintenanceTrackingAndUpdatePrevious domain=${contract.domain} contract=${contract.contract} insertCount=0 errors=1 total message sizeBytes=${messageSizeBytes} tookMs=${Date.now() - start}`, error);
            return TrackingSaveResult.createError(messageSizeBytes);
        });
    }
}
