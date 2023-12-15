import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
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
import { ApiTimestamp, EventType } from "../model/timestamp";
import { Port, ports } from "./portareas";

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
            .filter((ts) => ports.includes(ts.location.port as Port))
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
            if (!tt?.destination) {
                return timestamps;
            }
            if (tt.eta) {
                const timestamp = this.toTimestamp(
                    tt.eta[0] as unknown as Timestamp,
                    tt.destination[0] as unknown as Destination,
                    s.vessel[0] as unknown as Vessel,
                    calculated,
                    EventType.ETA
                );
                timestamps.push(timestamp);
                // ETA timestamps from VTS A sources must also be published as ETB timestamps
                if (calculated) {
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
                    this.toTimestamp(
                        tt.etd[0] as unknown as Timestamp,
                        tt.destination[0] as unknown as Destination,
                        s.vessel[0] as unknown as Vessel,
                        calculated,
                        EventType.ETD
                    )
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
