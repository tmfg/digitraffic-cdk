import * as DataDb from "../db/data";
import {DTDatabase, inDatabase} from "digitraffic-common/database/database";
import moment from "moment";
import {Position} from "geojson";
import {DbDomainContract, DbDomainTaskMapping, DbLatestTracking, DbMaintenanceTracking, DbTextId, DbWorkMachine} from "../model/db-data";
import {TrackingSaveResult, UNKNOWN_TASK_NAME} from "../model/tracking-save-result";
import {PaikanninApi} from "../api/paikannin";
import {ApiDevice, ApiWorkevent, ApiWorkeventDevice} from "../model/paikannin-api-data";
import {PAIKANNIN_MAX_MINUTES_TO_HISTORY, PAIKANNIN_MIN_MINUTES_FROM_PRESENT} from "../constants";
import * as CommonUpdateService from "./common-update";
import * as PaikanninUtils from "./paikannin-utils";
import * as Utils from "./utils";
import * as Geometry from "digitraffic-common/utils/geometry";

export class PaikanninUpdate {

    readonly api: PaikanninApi;

    constructor(api: PaikanninApi) {
        this.api = api;
    }

    /**
     * Adds contract for domain if it's missing
     * @param domain
     */
    upsertContractForDomain(domain: string): Promise<DbTextId|null> {
        const contract: DbDomainContract = {
            domain: domain,
            contract: domain,
            name: domain,
        };
        return inDatabase((db: DTDatabase) => {
            return DataDb.upsertContract(db, contract);
        });
    }

    /**
     * Updates task mappings for domain
     * @param domainName domain that is updated
     * @return count of new task mappings
     */
    async updateTaskMappingsForDomain(domainName: string): Promise<number> {
        // api
        const devices: ApiDevice[] = await this.api.getDevices();
        const allIoChannels: string[] = devices.flatMap(d => d.ioChannels ).map(c => c.name.trim());
        const uniqueIoChannels: string[] = [...new Set(allIoChannels)];

        const taskMappings: DbDomainTaskMapping[] =
            uniqueIoChannels.map(task => ({
                name: UNKNOWN_TASK_NAME,
                domain: domainName,
                // eslint-disable-next-line camelcase
                original_id: task,
                ignore: true,
            }));
        return inDatabase(db => {
            return DataDb.upsertTaskMappings(db, taskMappings);
        }).then((values) => {
            let count = 0;
            values.forEach((value) => {
                if (value) {
                    console.info(`method=PaikanninUpdate.updateTaskMappingsForDomain domain=${domainName} added:  + ${JSON.stringify(value)}`);
                    count++;
                }
            });
            return count;
        });
    }

    /**
     * @param domainName Solution domain name ie. myprovider-helsinki
     * @return TrackingSaveResult update result
     */
    async updateTrackingsForDomain(domainName: string): Promise<TrackingSaveResult> {

        const timerStart = Date.now();


        try {

            return await inDatabase(async (db: DTDatabase) => {

                const contract: DbDomainContract|null = await DataDb.getContractWithSource(db, domainName);

                if (!contract) {
                    console.info(`method=PaikanninUpdate.updateTrackingsForDomain No contract with source for domain=${domainName}`);
                    return TrackingSaveResult.createSaved(0,0);
                }

                // Don't get latest minute as data comes to api in "realtime"
                // so there is variation when data arrives. By getting only over 2 min old data
                // makes it more complete
                const now = moment();
                const startTime = moment(now).subtract(PAIKANNIN_MAX_MINUTES_TO_HISTORY, 'minutes').toDate();
                const endTime = moment(now).subtract(PAIKANNIN_MIN_MINUTES_FROM_PRESENT, 'minutes').toDate();

                const events: ApiWorkeventDevice[] = await this.api.getWorkEvents(startTime, endTime);

                const taskMappings: DbDomainTaskMapping[] = await DataDb.getTaskMappings(db, domainName);

                return Promise.allSettled(events.map((device: ApiWorkeventDevice) => {
                    return this.updateApiDeviceTrackings(db, contract, taskMappings, device);
                })).then((results: PromiseSettledResult<TrackingSaveResult>[]) => {
                    const summedResult = CommonUpdateService.sumResultsFromPromises(results);
                    console.info(`method=PaikanninUpdate.updateTrackingsForDomain domain=${domainName} count=${summedResult.saved} errors=${summedResult.errors} tookMs=${Date.now() - timerStart}`);
                    return summedResult;
                }).then((finalResult) => {
                    return CommonUpdateService.updateDataUpdated(finalResult);
                }).catch(error => {
                    console.error(`method=PaikanninUpdate.updateTrackingsForDomain failed domain=${domainName} tookMs=${Date.now() - timerStart}`, error);
                    throw error;
                });
            });
        } catch (error) {
            console.error(`method=PaikanninUpdate.updateTrackingsForDomain domain=${domainName} Failed for all`, error);
            throw error;
        }
    }

    private async updateApiDeviceTrackings(db: DTDatabase, contract: DbDomainContract, taskMappings: DbDomainTaskMapping[], device: ApiWorkeventDevice): Promise<TrackingSaveResult> {
        const timerStart = Date.now();
        if (device.workEvents.length == 0) {
            return TrackingSaveResult.createSaved(0, 0);
        } else {
            console.info(`method=PaikanninUpdate.updateApiWorkeventDeviceTrackings machineHarjaId=${device.deviceId} device.workEvents count=${device.workEvents.length}`);
        }
        const workMachine: DbWorkMachine = PaikanninUtils.createDbWorkMachine(contract.domain, device.deviceId, device.deviceName);

        // Create new work machine or get reference to existing one
        const machineId = await db.tx(tx => {
            return DataDb.upsertWorkMachine(tx, workMachine);
        });
        // Get latest tracking for workMachine to extend the tracking and get end_time of it
        const latest: DbLatestTracking | null = await DataDb.findLatestNotFinishedTrackingForWorkMachine(db, contract.domain, machineId.id);
        const result: ApiWorkevent[][] = PaikanninUtils.groupEventsToIndividualTrackings(device.workEvents, latest?.end_time);

        const maintenanceTrackings: DbMaintenanceTracking[] = result.map(group => {
            return PaikanninUtils.createDbMaintenanceTracking(contract, machineId.id, group, taskMappings);
        }).filter((value): value is DbMaintenanceTracking => value != null);

        console.info(`method=PaikanninUpdate.updateApiWorkeventDeviceTrackings workMachineId=${machineId.id} machineHarjaId=${workMachine.harjaId} maintenanceTrackings to save count=${maintenanceTrackings.length}`);

        // mark last tracking as not finished as next fetch of the api data can continue it
        if (maintenanceTrackings.length > 0) {
            maintenanceTrackings[maintenanceTrackings.length - 1].finished = false;
        }

        return this.saveMaintenanceTrackings(db, contract, maintenanceTrackings, latest)
            .then(saveResult => {

                const summedResult = new TrackingSaveResult(Utils.countEstimatedSizeOfMessage(result), saveResult.saved, saveResult.errors);
                console.info(`method=PaikanninUpdate.updateApiWorkeventDeviceTrackings domain=${contract.domain} workMachineId=${machineId.id} machineHarjaId=${workMachine.harjaId} count=${summedResult.saved} errors=${summedResult.errors} tookMs=${Date.now() - timerStart}`);
                return summedResult;
            });
    }

    saveMaintenanceTrackings(db: DTDatabase, contract: DbDomainContract, maintenanceTrackings: DbMaintenanceTracking[], latest: DbLatestTracking|null): Promise<TrackingSaveResult> {
        const timerStart = Date.now();
        const machineId = maintenanceTrackings[0].work_machine_id;
        return db.tx(async tx => {

            // If first new tracking is extending latest tracking in db -> update latest in db also with
            // new end point and time
            if (latest &&
                !latest.finished &&
                maintenanceTrackings.length > 0) {

                const nextTracking: DbMaintenanceTracking = maintenanceTrackings[0];
                const previousEndPosition: Position = JSON.parse(latest.last_point).coordinates;
                const nextStartPosition: Position = PaikanninUtils.getStartPosition(nextTracking);
                if (PaikanninUtils.isExtendingPreviousTracking(previousEndPosition, nextStartPosition, latest.end_time, nextTracking.start_time)) {
                    // Append new end point only, if it's distinct from the current end point
                    // If tasks has changed that wont make a difference as also then
                    // the new tracking's start point is the previous tracking's end point
                    if (Geometry.areDistinctPositions(previousEndPosition, nextStartPosition)) {
                        await DataDb.appendMaintenanceTrackingEndPointAndMarkFinished(
                            tx, latest.id, nextStartPosition, nextTracking.start_time, nextTracking.start_direction,
                        );
                    } else {
                        await DataDb.markMaintenanceTrackingFinished(tx, latest.id);
                    }

                    // If the task are the same, then set reference to previous tracking id
                    if (Utils.hasBothStringArraysSameValues(latest.tasks, nextTracking.tasks)) {
                        // eslint-disable-next-line camelcase
                        nextTracking.previous_tracking_id = latest.id;
                    }
                } else {
                    await DataDb.markMaintenanceTrackingFinished(tx, latest.id);
                }
            }

            return Promise.allSettled(maintenanceTrackings.map((mt) => {

                return DataDb.insertMaintenanceTracking(tx, mt)
                    .then(() => {
                        return TrackingSaveResult.createSaved(0, 1);
                    }).catch(error => {
                        console.error(`method=PaikanninUpdate.saveMaintenanceTrackings error in upsertMaintenanceTracking`, error);
                        return TrackingSaveResult.createError(0);
                    });
            })).then(async (results: PromiseSettledResult<TrackingSaveResult>[]) => {
                const summedResult = CommonUpdateService.sumResultsFromPromises(results);
                await DataDb.updateContractLastUpdated(tx, contract.domain, contract.domain, new Date());
                console.info(`method=PaikanninUpdate.saveMaintenanceTrackings domain=${contract.domain} workMachineId=${machineId} count=${summedResult.saved} errors=${summedResult.errors} tookMs=${Date.now() - timerStart}`);
                return summedResult;
            }).catch(error => {
                console.error(`method=PaikanninUpdate.saveMaintenanceTrackings failed domain=${contract.domain} workMachineId=${machineId} tookMs=${Date.now() - timerStart}`, error);
                return TrackingSaveResult.createError(0);
            });
        }).catch(error => {
            console.error(`method=PaikanninUpdate.saveMaintenanceTrackings failed in transaction domain=${contract.domain} workMachineId=${machineId} tookMs=${Date.now() - timerStart}`, error);
            return TrackingSaveResult.createError(0);
        });
    }
}
