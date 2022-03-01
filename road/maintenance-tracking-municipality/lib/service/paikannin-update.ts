import * as DataDb from "../db/data";
import {DTDatabase, inDatabase, inDatabaseReadonly} from "digitraffic-common/database/database";
import moment from "moment";
import {Position} from "geojson";
import {DbDomainContract, DbDomainTaskMapping, DbLatestTracking, DbMaintenanceTracking, DbWorkMachine} from "../model/db-data";
import {TrackingSaveResult} from "../model/service-data";
import {PaikanninApi} from "../api/paikannin";
import {ApiWorkevent, ApiWorkeventDevice, ApiWorkeventIoDevice} from "../model/paikannin-api-data";
import * as PaikanninUtils from "./paikannin-utils";
import {GeoJsonLineString, GeoJsonPoint} from "digitraffic-common/utils/geometry";
import {PAIKANNIN_MAX_MINUTES_TO_HISTORY, PAIKANNIN_MIN_MINUTES_FROM_PRESENT} from "../constants";
import * as CommonUpdateService from "./common-update";


export class PaikanninUpdate {

    readonly api: PaikanninApi;

    constructor(api: PaikanninApi) {
        this.api = api;
    }

    /**
     * @param domainName Solution domain name ie. myprovider-helsinki
     * @return TrackingSaveResult update result
     */
    async updateTrackingsForDomain(domainName: string): Promise<TrackingSaveResult> {

        const timerStart = Date.now();

        try {

            const contract: DbDomainContract|null = await inDatabaseReadonly((db: DTDatabase) => {
                return DataDb.getContractWithSource(db, domainName);
            });

            if (!contract) {
                console.info(`method=PaikanninUpdate.updateTrackingsForDomain No contract with soure for domain=${domainName}`);
                return TrackingSaveResult.createSaved(0,0);
            }

            // Don't get latest minute as data comes to api in "realtime"
            // so there is variation when data arrives. By getting only over 2 min old data
            // makes it more complete
            const now = moment();
            const startTime = moment(now).subtract(PAIKANNIN_MAX_MINUTES_TO_HISTORY, 'minutes').toDate();
            const endTime = moment(now).subtract(PAIKANNIN_MIN_MINUTES_FROM_PRESENT, 'minutes').toDate();
            // const test = 20;
            // const m = moment('2022-02-25T13:20:00Z').toISOString();
            // const endTime = moment('2022-02-25T13:20:00Z').add(test+5, 'minutes').toDate();
            // const startTime = moment('2022-02-25T13:20:00Z').add(test, 'minutes').toDate();
            const events: ApiWorkeventDevice[] = await this.api.getWorkEvents(startTime, endTime);

            const taskMappings: DbDomainTaskMapping[] = await inDatabaseReadonly((db: DTDatabase) => {
                return DataDb.getTaskMappings(db, domainName);
            });

            return inDatabase((db: DTDatabase) => {

                return Promise.allSettled(events.map(async (device: ApiWorkeventDevice) => {

                    if (device.workEvents.length == 0) {
                        return TrackingSaveResult.createSaved(0, 0);
                    } else {
                        console.info(`method=PaikanninUpdate.updateTrackingsForDomain machineHarjaId=${device.deviceId} device.workEvents count=${device.workEvents.length}`);
                    }
                    const workMachine: DbWorkMachine = PaikanninUtils.createDbWorkMachine(domainName, device.deviceId, device.deviceName);

                    // Create new work machine or get reference to existing one
                    const machineId = await db.tx(tx => {
                        return DataDb.upsertWorkMachine(tx, workMachine);
                    });
                    // Get latest tracking for workMachine to extend the tracking
                    const latest: DbLatestTracking | null = await DataDb.findLatestTrackingForWorkMachine(db, domainName, machineId.id);
                    const result: ApiWorkevent[][] = PaikanninUtils.groupEventsToIndividualTrackings(device.workEvents, latest?.end_time);
                    const messageSizeBytes = Buffer.byteLength(JSON.stringify(events)); // Just estimate of the size of new data

                    const maintenanceTrackings: DbMaintenanceTracking[] = result.map(group => {
                        return this.createDbMaintenanceTracking(contract, machineId.id, group, taskMappings);
                    }).filter((value): value is DbMaintenanceTracking => value != null);

                    console.info(`method=PaikanninUpdate.updateTrackingsForDomain workMachineId=${machineId.id} machineHarjaId=${workMachine.harjaId} maintenanceTrackings to save count=${maintenanceTrackings.length}`);

                    // mark last tracking as not finished as next fetch of the api data can continue it
                    if (maintenanceTrackings.length > 0) {
                        maintenanceTrackings[maintenanceTrackings.length - 1].finished = false;
                    }

                    return db.tx(async tx => {

                        // Is first new tracking extending latest tracking in db
                        if (latest &&
                            !latest.finished &&
                            maintenanceTrackings.length > 0) {
                            const nextTracking: DbMaintenanceTracking = maintenanceTrackings[0];
                            const previousEndPosition: Position = JSON.parse(latest.last_point).coordinates;
                            const nextStartPosition: Position = PaikanninUtils.getStartPosition(nextTracking);
                            if (PaikanninUtils.isExtendingPreviousTracking(previousEndPosition, nextStartPosition, latest.end_time, nextTracking.start_time)) {
                                // Append new end point only, if it's distinct from the current end point
                                if (PaikanninUtils.areDistinctPositions(previousEndPosition, nextStartPosition)) {
                                    await DataDb.appendMaintenanceTrackingEndPoint(
                                        tx, latest.id, nextStartPosition, nextTracking.start_time, nextTracking.start_direction,
                                    );
                                }

                                // If the task are the same, then set reference to previous tracking id
                                if (PaikanninUtils.hasBothStringArraysSameValues(latest.tasks, nextTracking.tasks)) {
                                    // eslint-disable-next-line camelcase
                                    nextTracking.previous_tracking_id = latest.id;
                                }
                            }
                        }

                        return Promise.allSettled(maintenanceTrackings.map((mt) => {

                            // console.info(`method=PaikanninUpdate.updateTrackingsForDomain upsertMaintenanceTracking...`);
                            return DataDb.upsertMaintenanceTracking(tx, mt)
                                .then(() => {
                                    // console.info(`method=PaikanninUpdate.updateTrackingsForDomain upsertMaintenanceTracking...${id}`);
                                    return TrackingSaveResult.createSaved(0, 1);
                                }).catch(error => {
                                    console.error(`method=PaikanninUpdate.updateTrackingsForDomain error in upsertMaintenanceTracking`, error);
                                    return TrackingSaveResult.createError(0);
                                });
                        })).then((results: PromiseSettledResult<TrackingSaveResult>[]) => {
                            const summedResultPerMachine = CommonUpdateService.sumResults(results);
                            summedResultPerMachine.sizeBytes = messageSizeBytes;
                            console.info(`method=PaikanninUpdate.updateTrackingsForDomain workMachineId=${machineId.id} machineHarjaId=${workMachine.harjaId} domain=${domainName} count=${summedResultPerMachine.saved} errors=${summedResultPerMachine.errors} tookMs=${Date.now() - timerStart}`);
                            return summedResultPerMachine;
                        }).catch(error => {
                            console.error(`method=PaikanninUpdate.updateTrackingsForDomain failed domain=${domainName} tookMs=${Date.now() - timerStart}`, error);
                            return TrackingSaveResult.createError(messageSizeBytes);
                        });
                    });

                })).then((results: PromiseSettledResult<TrackingSaveResult>[]) => {
                    const summedResult = CommonUpdateService.sumResults(results);
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

    private createDbMaintenanceTracking(contract: DbDomainContract,
        workMachineId: bigint,
        events: ApiWorkevent[],
        taskMappings: DbDomainTaskMapping[]) : DbMaintenanceTracking | null {

        const tasks: string[] = this.getTasksForOperations(events[0].ioChannels, taskMappings);
        if (tasks.length === 0) {
            return null;
        }

        const firstEvent = events[0];
        // lastPoint
        const lastEvent = events[events.length-1];
        const lastPoint = new GeoJsonPoint([lastEvent.lon, lastEvent.lat]);
        const lineString = this.createLineStringFromEvents(events);

        return {
            // direction: 0,
            /* eslint-disable camelcase */
            sending_time: lastEvent.timestamp,
            start_time: firstEvent.timestamp,
            end_time: lastEvent.timestamp,
            last_point: lastPoint,
            line_string: lineString,
            direction: lastEvent.heading,
            sending_system: contract.domain,
            work_machine_id: workMachineId,
            tasks: tasks,
            domain: contract.domain,
            contract: contract.contract,
            message_original_id: 'none',
            finished: true,
            // This is additional meta data, not saved to eb but used to update previous tracking
            start_direction: lastEvent.heading,
            /* eslint-enable camelcase */
        };
    }

    /**
     * Map domain route operations to Harja tasks
     * @param operations ApiWorkeventIoDevices to map from
     * @param taskMappings mapping of tasks from database
     */
    getTasksForOperations(operations: ApiWorkeventIoDevice[], taskMappings: DbDomainTaskMapping[]): string[] {
        if (operations === undefined) {
            return [];
        }

        return operations.reduce(function (filtered: string[], operation) {
            const taskMapping = taskMappings.find((mapping: DbDomainTaskMapping): boolean => {
                return mapping.original_id == operation.name && !mapping.ignore;
            });
            if (taskMapping && !filtered.includes(taskMapping.name)) {
                return filtered.concat(taskMapping.name);
            }
            return filtered;
        }, []);
    }

    private createLineStringFromEvents(events: ApiWorkevent[]) : GeoJsonLineString|null {
        if (!events || events.length < 2) {
            return null;
        }
        const lineStringCoordinates: Position[] = events.reduce((coordinates: Position[], nextEvent) => {
            const nextCoordinate: Position = [nextEvent.lon, nextEvent.lat];
            if (coordinates.length > 0 ) {
                const previousCoordinate: Position = coordinates[coordinates.length-1];
                // Linestring points must differ from previous values
                if ( previousCoordinate[0] !=  nextCoordinate[0] || previousCoordinate[1] !=  nextCoordinate[1]) {
                    coordinates.push(nextCoordinate);
                }
            } else {
                coordinates.push(nextCoordinate);
            }
            return coordinates;
        }, []);

        if (lineStringCoordinates.length > 1) {
            return new GeoJsonLineString(lineStringCoordinates);
        }
        return null;
    }
}
