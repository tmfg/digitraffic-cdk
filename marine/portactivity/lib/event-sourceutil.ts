import {ApiTimestamp, EventType} from "./model/timestamp";
import * as R from "ramda";
import moment, {Moment} from "moment-timezone";
import {EventSource} from "./model/eventsource";

export const VTS_A = 'VTS A';
export const VTS_O = 'VTS O';
export const PRED = 'PRED';

export const eventSourceMap = new Map<string, string>([
    [EventSource.PORTNET, "PNET"],
    [EventSource.AWAKE_AI, VTS_A],
    [EventSource.PORT_HANKO, EventSource.PORT_HANKO],
    [EventSource.SCHEDULES_VTS_CONTROL, VTS_O],
    [EventSource.SCHEDULES_CALCULATED, VTS_A],
    [EventSource.AWAKE_AI_PRED, PRED],
]);

const eventSourcePriorities = new Map<string, number>([
    [EventSource.PORTNET, 10],
    [EventSource.AWAKE_AI_PRED, 40],
    [EventSource.AWAKE_AI, 80],
    [EventSource.SCHEDULES_CALCULATED, 90],
    [EventSource.SCHEDULES_VTS_CONTROL, 95],
    [EventSource.PORT_HANKO, 100],
]);

export function isPortnetTimestamp(timestamp: ApiTimestamp): boolean {
    return timestamp.source === EventSource.PORTNET;
}

export function getDisplayableNameForEventSource(eventSource: string): string {
    return eventSourceMap.get(eventSource) || eventSource;
}

const vtsASources: string[] = [];
for (const entry of eventSourceMap.entries()) {
    if (entry[1] === VTS_A) {
        vtsASources.push(entry[0]);
    }
}

export function momentAverage(moments: Moment[]): string {
    const averageMillis = R.reduce((acc, elem) => acc + elem.valueOf(), 0, moments) / moments.length;
    return moment(averageMillis).toISOString();
}

type MergeableTimestamp = {
    readonly eventTime: string
    readonly source: string
    readonly eventType: EventType
    readonly portcallId?: number | null
}

export function mergeTimestamps(timestamps: MergeableTimestamp[]): MergeableTimestamp[] {
    let ret: MergeableTimestamp[] = timestamps;

    // group by portcall id and event type
    const byPortcallId: MergeableTimestamp[][] = R.compose(R.values,
        R.groupBy((ts: MergeableTimestamp) => (ts.portcallId as number).toString() + ts.eventType))(timestamps);

    let needToSort = false;

    for (const portcallTimestamps of byPortcallId) {
        const vtsAStamps = portcallTimestamps.filter(t => vtsASources.includes(t.source));
        if (vtsAStamps.length > 1) {
            // build an average timestamp and discard the rest
            // use the source with the highest priority
            ret = ret.filter(t => !vtsAStamps.includes(t));
            const highestPriority = R.last(R.sortBy((ts => eventSourcePriorities.get(ts.source) as number), vtsAStamps)) as MergeableTimestamp;
            ret.push({ ...highestPriority, ...{
                eventTime: momentAverage(vtsAStamps.map(ts => moment(ts.eventTime))),
            }});
            needToSort = true;
        }
    }

    // re-sort as timestamp places can change after merging
    return needToSort ? R.sortBy((ts) => moment(ts.eventTime).valueOf(), ret) : ret;
}
