import { type DTDatabase, inDatabase } from "@digitraffic/common/dist/database/database";
import * as Geometry from "@digitraffic/common/dist/utils/geometry";
import { type GeoJsonPoint } from "@digitraffic/common/dist/utils/geojson-types";
import * as CommonUtils from "@digitraffic/common/dist/utils/utils";
import { type Position } from "geojson";
import { sub } from "date-fns/sub";
import { type PaikanninApi } from "../api/paikannin.js";
import { PAIKANNIN_MAX_MINUTES_TO_HISTORY, PAIKANNIN_MIN_MINUTES_FROM_PRESENT } from "../constants.js";
import * as DataDb from "../dao/data.js";
import {
    type DbDomainContract,
    type DbDomainTaskMapping,
    type DbLatestTracking,
    type DbMaintenanceTracking,
    type DbTextId,
    type DbWorkMachine
} from "../model/db-data.js";
import { type ApiDevice, type ApiWorkevent, type ApiWorkeventDevice } from "../model/paikannin-api-data.js";
import { TrackingSaveResult, UNKNOWN_TASK_NAME } from "../model/tracking-save-result.js";
import * as CommonUpdateService from "./common-update.js";
import * as PaikanninUtils from "./paikannin-utils.js";
import * as Utils from "./utils.js";
import logger from "./maintenance-logger.js";

export class PaikanninUpdate {
    readonly api: PaikanninApi;

    constructor(api: PaikanninApi) {
        this.api = api;
    }

    /**
     * Adds contract for domain if it's missing
     * @param domain
     */
    upsertContractForDomain(domain: string): Promise<DbTextId | undefined> {
        const contract: DbDomainContract = {
            domain: domain,
            contract: domain,
            name: domain
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
        const allIoChannels: string[] = devices.flatMap((d) => d.ioChannels).map((c) => c.name.trim());
        const uniqueIoChannels: string[] = [...new Set(allIoChannels)];

        const taskMappings: DbDomainTaskMapping[] = uniqueIoChannels.map((task) => ({
            name: UNKNOWN_TASK_NAME,
            domain: domainName,

            original_id: task,
            ignore: true
        }));
        return inDatabase((db) => {
            return DataDb.upsertTaskMappings(db, taskMappings);
        }).then((values) => {
            let count = 0;
            values.forEach((value) => {
                if (value) {
                    logger.info({
                        method: "PaikanninUpdate.updateTaskMappingsForDomain",
                        message: `added:  + ${JSON.stringify(value)}`,
                        customDomain: domainName
                    });
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
        const method = "PaikanninUpdate.updateTrackingsForDomain";
        try {
            return await inDatabase(async (db: DTDatabase) => {
                const contract: DbDomainContract | undefined = await DataDb.getContractWithSource(
                    db,
                    domainName
                );

                if (!contract) {
                    logger.info({
                        method,
                        message: `No contract with source`,
                        customDomain: domainName
                    });
                    return CommonUpdateService.updateDataChecked(
                        db,
                        domainName,
                        TrackingSaveResult.createSaved(0, 0)
                    );
                }

                // Don't get latest minute as data comes to api in "realtime"
                // so there is variation when data arrives. By getting only over 2 min old data
                // makes it more complete
                const now = new Date();
                const startTime = sub(now, { minutes: PAIKANNIN_MAX_MINUTES_TO_HISTORY });
                const endTime = sub(now, { minutes: PAIKANNIN_MIN_MINUTES_FROM_PRESENT });

                const events: ApiWorkeventDevice[] = await this.api.getWorkEvents(startTime, endTime);

                const taskMappings: DbDomainTaskMapping[] = await DataDb.getTaskMappings(db, domainName);

                const eventsWithMappedTasks: ApiWorkeventDevice[] = PaikanninUtils.filterEventsWithoutTasks(
                    events,
                    taskMappings
                );

                return Promise.allSettled(
                    eventsWithMappedTasks.map((device: ApiWorkeventDevice) => {
                        return this.updateApiDeviceTrackings(db, contract, taskMappings, device);
                    })
                )
                    .then((results: PromiseSettledResult<TrackingSaveResult>[]) => {
                        const summedResult = CommonUpdateService.sumResultsFromPromises(results);
                        logger.info({
                            method,
                            message: `finished`,
                            customDomain: domainName,
                            customCount: summedResult.saved,
                            customErrorCount: summedResult.errors,
                            tookMs: Date.now() - timerStart
                        });
                        return summedResult;
                    })
                    .then((finalResult) => {
                        return CommonUpdateService.updateDataChecked(db, domainName, finalResult);
                    })
                    .catch((error: Error) => {
                        logger.error({
                            method,
                            message: `failed`,
                            customDomain: domainName,
                            tookMs: Date.now() - timerStart,
                            error
                        });
                        throw error;
                    });
            });
        } catch (error) {
            logger.error({
                method,
                message: `Failed for all`,
                customDomain: domainName,
                error
            });
            throw error;
        }
    }

    private async updateApiDeviceTrackings(
        db: DTDatabase,
        contract: DbDomainContract,
        taskMappings: DbDomainTaskMapping[],
        device: ApiWorkeventDevice
    ): Promise<TrackingSaveResult> {
        const timerStart = Date.now();
        if (device.workEvents.length === 0) {
            return TrackingSaveResult.createSaved(0, 0);
        } else {
            logger.info({
                method: "PaikanninUpdate.updateApiWorkeventDeviceTrackings",
                message: `machineHarjaId=${device.deviceId} device.workEvents count=${device.workEvents.length}`,
                customDomain: contract.domain,
                customContract: contract.contract
            });
        }
        const workMachine: DbWorkMachine = PaikanninUtils.createDbWorkMachine(
            contract.domain,
            device.deviceId,
            device.deviceName
        );

        // Create new work machine or get reference to existing one
        const machineId = await db.tx((tx) => {
            return DataDb.upsertWorkMachine(tx, workMachine);
        });
        // Get latest tracking for workMachine to extend the tracking and get end_time of it
        const latest: DbLatestTracking | undefined = await DataDb.findLatestNotFinishedTrackingForWorkMachine(
            db,
            contract.domain,
            machineId.id
        );
        const result: ApiWorkevent[][] = PaikanninUtils.groupEventsToIndividualTrackings(
            device.workEvents,
            latest?.end_time
        );

        const maintenanceTrackings: DbMaintenanceTracking[] = result
            .map((group) => {
                return PaikanninUtils.createDbMaintenanceTracking(
                    contract,
                    machineId.id,
                    group,
                    taskMappings
                );
            })
            .filter((value): value is DbMaintenanceTracking => value !== undefined);

        logger.info({
            method: "PaikanninUpdate.updateApiWorkeventDeviceTrackings",
            message: `maintenanceTrackings to save`,
            customDomain: contract.domain,
            customContract: contract.contract,
            customCount: maintenanceTrackings.length,
            customWorkMachineId: machineId.id,
            customMachineHarjaId: workMachine.harjaId.toString()
        });

        // mark last tracking as not finished as next fetch of the api data can continue it
        if (maintenanceTrackings.length > 0) {
            // @ts-ignore
            maintenanceTrackings[maintenanceTrackings.length - 1].finished = false;
        }

        return this.saveMaintenanceTrackings(db, contract, maintenanceTrackings, latest).then(
            (saveResult) => {
                const summedResult = new TrackingSaveResult(
                    Utils.countEstimatedSizeOfMessage(result),
                    saveResult.saved,
                    saveResult.errors
                );
                logger.info({
                    method: "PaikanninUpdate.updateApiWorkeventDeviceTrackings",
                    message: `domain=${contract.domain} workMachineId=${machineId.id} machineHarjaId=${workMachine.harjaId} errors=${summedResult.errors}`,
                    tookMs: Date.now() - timerStart,
                    customCount: summedResult.saved
                });
                return summedResult;
            }
        );
    }

    saveMaintenanceTrackings(
        db: DTDatabase,
        contract: DbDomainContract,
        maintenanceTrackings: DbMaintenanceTracking[],
        latest: DbLatestTracking | undefined
    ): Promise<TrackingSaveResult> {
        const timerStart = Date.now();
        const nextTracking = maintenanceTrackings[0];
        if (!nextTracking) {
            return Promise.resolve(TrackingSaveResult.createSaved(0, 0));
        }
        const machineId = nextTracking.work_machine_id;
        return db
            .tx(async (tx) => {
                // If first new tracking is extending latest tracking in db -> update latest in db also with
                // new end point and time
                if (latest && !latest.finished && maintenanceTrackings.length > 0) {
                    const previousEndPosition = (JSON.parse(latest.last_point) as GeoJsonPoint).coordinates;
                    const nextStartPosition: Position = Utils.getTrackingStartPoint(nextTracking);
                    if (
                        PaikanninUtils.isExtendingPreviousTracking(
                            previousEndPosition,
                            nextStartPosition,
                            latest.end_time,
                            nextTracking.start_time
                        )
                    ) {
                        // Append new end point only, if it's distinct from the current end point
                        // If tasks has changed that wont make a difference as also then
                        // the new tracking's start point is the previous tracking's end point
                        if (Geometry.areDistinctPositions(previousEndPosition, nextStartPosition)) {
                            await DataDb.appendMaintenanceTrackingEndPointAndMarkFinished(
                                tx,
                                latest.id,
                                nextStartPosition,
                                nextTracking.start_time,
                                nextTracking.start_direction
                            );
                        } else {
                            await DataDb.markMaintenanceTrackingFinished(tx, latest.id);
                        }

                        // If the task are the same, then set reference to previous tracking id
                        if (CommonUtils.bothArraysHasSameValues(latest.tasks, nextTracking.tasks)) {
                            nextTracking.previous_tracking_id = latest.id;
                        }
                    } else {
                        await DataDb.markMaintenanceTrackingFinished(tx, latest.id);
                    }
                }

                return Promise.allSettled(
                    maintenanceTrackings.map((mt) => {
                        return DataDb.insertMaintenanceTracking(tx, mt)
                            .then(() => {
                                return TrackingSaveResult.createSaved(0, 1);
                            })
                            .catch((error: Error) => {
                                logger.error({
                                    method: "PaikanninUpdate.saveMaintenanceTrackings",
                                    message: "error in upsertMaintenanceTracking",
                                    error
                                });
                                return TrackingSaveResult.createError(0);
                            });
                    })
                )
                    .then(async (results: PromiseSettledResult<TrackingSaveResult>[]) => {
                        const summedResult = CommonUpdateService.sumResultsFromPromises(results);
                        await DataDb.updateContractLastUpdated(
                            tx,
                            contract.domain,
                            contract.domain,
                            new Date()
                        );
                        logger.info({
                            method: "PaikanninUpdate.saveMaintenanceTrackings",
                            message: `finished`,
                            customDomain: contract.domain,
                            customContract: contract.contract,
                            customCount: summedResult.saved,
                            customErrorCount: summedResult.errors,
                            tookMs: Date.now() - timerStart
                        });
                        return summedResult;
                    })
                    .catch((error: Error) => {
                        logger.error({
                            method: "PaikanninUpdate.saveMaintenanceTrackings",
                            message: `failed`,
                            customDomain: contract.domain,
                            customContract: contract.contract,
                            tookMs: Date.now() - timerStart,
                            error
                        });
                        return TrackingSaveResult.createError(0);
                    });
            })
            .catch((error: Error) => {
                logger.error({
                    method: "PaikanninUpdate.saveMaintenanceTrackings",
                    message: `failed in transaction workMachineId=${machineId}`,
                    customDomain: contract.domain,
                    customContract: contract.contract,
                    tookMs: Date.now() - timerStart,
                    error
                });
                return TrackingSaveResult.createError(0);
            });
    }
}
