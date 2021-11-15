import * as SchedulesApi from "../api/schedules";
import {Destination, SchedulesResponse, Timestamp, Vessel} from "../api/schedules";
import {ApiTimestamp, EventType} from "../model/timestamp";
import {ports} from "./portareas";
import moment from 'moment-timezone';
import {EventSource} from "../model/eventsource";

export async function getTimestampsUnderVtsControl(url: string): Promise<ApiTimestamp[]> {
    const resp = await SchedulesApi.getSchedulesTimestamps(url, false);
    return filterTimestamps(schedulesToTimestamps(resp, false));
}

export async function getCalculatedTimestamps(url: string): Promise<ApiTimestamp[]> {
    //const resp = await SchedulesApi.getSchedulesTimestamps(url, true);
    //return filterTimestamps(schedulesToTimestamps(resp, true));

    // XXX temporarily disabled due to bad data

    return [];
}

export function filterTimestamps(timestamps: ApiTimestamp[]) {
    return timestamps
        .filter(ts => ports.includes(ts.location.port))
        .filter(ts =>
            ts.eventType === EventType.ETD ? moment(ts.eventTime) >= moment().subtract(5, 'minutes') : true);
}

export function schedulesToTimestamps(resp: SchedulesResponse, calculated: boolean): ApiTimestamp[] {
    return resp.schedules.schedule.flatMap(s => {
        const timestamps: ApiTimestamp[] = [];
        const tt = s.timetable[0];
        if (!tt.destination) {
            return timestamps;
        }
        if (tt.eta) {
            timestamps.push(toTimestamp(tt.eta[0], tt.destination[0], s.vessel[0], calculated, EventType.ETA));
        }
        if (tt.etd) {
            timestamps.push(toTimestamp(tt.etd[0], tt.destination[0], s.vessel[0], calculated, EventType.ETD));
        }
        return timestamps;
    });
}

function toTimestamp(
    ts: Timestamp,
    destination: Destination,
    vessel: Vessel,
    calculated: boolean,
    eventType: EventType.ETA | EventType.ETD): ApiTimestamp {

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
        },
    };
}
