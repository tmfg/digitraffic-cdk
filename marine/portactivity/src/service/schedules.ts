import moment from "moment-timezone";
import {
    Destination,
    SchedulesApi,
    SchedulesDirection,
    SchedulesResponse,
    Timestamp,
    Vessel
} from "../api/schedules";
import { EventSource } from "../model/eventsource";
import type { Locode } from "../model/locode";
import { ApiTimestamp, EventType } from "../model/timestamp";
import { VTS_A_ETB_PORTS } from "../model/vts-a-etb-ports";
import { ports } from "./portareas";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export class SchedulesService {
    private readonly api: SchedulesApi;

    constructor(api: SchedulesApi) {
        this.api = api;
    }

    getTimestampsUnderVtsControl(): Promise<ApiTimestamp[]> {
        return this.doGetTimestamps(false);
    }

    getCalculatedTimestamps(): Promise<ApiTimestamp[]> {
        return this.doGetTimestamps(true);
    }

    private async doGetTimestamps(calculated: boolean): Promise<ApiTimestamp[]> {
        const timestampsEast = await this.api.getSchedulesTimestamps(SchedulesDirection.EAST, calculated);
        const timestampsWest = await this.api.getSchedulesTimestamps(SchedulesDirection.WEST, calculated);
        return this.filterTimestamps(this.schedulesToTimestamps(timestampsEast, calculated)).concat(
            this.filterTimestamps(this.schedulesToTimestamps(timestampsWest, calculated))
        );
    }

    filterTimestamps(timestamps: ApiTimestamp[]): ApiTimestamp[] {
        return timestamps
            .filter((ts) => ports.includes(ts.location.port))
            .filter((ts) =>
                ts.eventType === EventType.ETD
                    ? moment(ts.eventTime) >= moment().subtract(5, "minutes")
                    : true
            );
    }

    schedulesToTimestamps(resp: SchedulesResponse, calculated: boolean): ApiTimestamp[] {
        return resp.schedules.schedule.flatMap((s) => {
            const timestamps: ApiTimestamp[] = [];
            const tt = s.timetable[0];
            if (!tt.destination) {
                return timestamps;
            }
            if (tt.eta) {
                const timestamp = this.toTimestamp(
                    tt.eta[0],
                    tt.destination[0],
                    s.vessel[0],
                    calculated,
                    EventType.ETA
                );
                timestamps.push(timestamp);
                // also generate an ETB timestamp for VTS calculated ETA if destination is in list of locodes to be published as ETB timestamps
                if (calculated && VTS_A_ETB_PORTS.includes(tt.destination[0].$.locode as Locode)) {
                    logger.debug(
                        "generated ETB timestamp for SCHEDULES_CALCULATED " +
                            JSON.stringify({
                                ...timestamp,
                                eventType: EventType.ETB
                            })
                    );
                    timestamps.push({ ...timestamp, eventType: EventType.ETB });
                }
            }
            if (tt.etd) {
                timestamps.push(
                    this.toTimestamp(tt.etd[0], tt.destination[0], s.vessel[0], calculated, EventType.ETD)
                );
            }
            return timestamps;
        });
    }

    toTimestamp(
        ts: Timestamp,
        destination: Destination,
        vessel: Vessel,
        calculated: boolean,
        eventType: EventType.ETA | EventType.ETD | EventType.ETB
    ): ApiTimestamp {
        return {
            location: {
                port: destination.$.locode // TODO portArea when portfacility translation works
            },
            eventType,
            eventTime: ts.$.time,
            recordTime: ts.$.uts,
            source: calculated ? EventSource.SCHEDULES_CALCULATED : EventSource.SCHEDULES_VTS_CONTROL,
            ship: {
                mmsi: Number(vessel.$.mmsi),
                imo: Number(vessel.$.imo)
            }
        };
    }
}
