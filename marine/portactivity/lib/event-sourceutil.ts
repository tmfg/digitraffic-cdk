import {ApiTimestamp} from "./model/timestamp";
import * as R from "ramda";
import moment, {Moment} from "moment-timezone";
import {EventSource} from "./model/eventsource";

export const VTS_A = 'VTS A';
export const VTS_O = 'VTS O';

const DEFAULT_PRIORITY = -1;

export const eventSourceMap = new Map<string, string>([
    [EventSource.PORTNET, "PNET"],
    [EventSource.VTS, VTS_A],
    [EventSource.PORT_HANKO, EventSource.PORT_HANKO],
    [EventSource.TEQPLAY, VTS_A],
    [EventSource.SCHEDULES_VTS_CONTROL, VTS_O],
    [EventSource.SCHEDULES_CALCULATED, VTS_A]
]);

const eventSourcePriorities = new Map<string, number>([
    [EventSource.PORTNET, 10],
    [EventSource.VTS, 80],
    [EventSource.TEQPLAY, 85],
    [EventSource.SCHEDULES_CALCULATED, 90],
    [EventSource.SCHEDULES_VTS_CONTROL, 95],
    [EventSource.PORT_HANKO, 100]
]);

export function isPortnetTimestamp(timestamp: ApiTimestamp) {
    return timestamp.source == EventSource.PORTNET;
}

export function getDisplayableNameForEventSource(eventSource: string): string {
    return eventSourceMap.get(eventSource) || eventSource;
}

export function selectBestTimestamp(timestamp: any): any {
    const bestTimestamp = {} as any;

    for(const sourceName of Object.keys(timestamp)) {
        const timestampTime = timestamp[sourceName];
        const timestampPriority = getPriority(sourceName);

        if(typeof bestTimestamp.priority === 'undefined' || bestTimestamp.priority < timestampPriority) {
            bestTimestamp.source = sourceName;
            bestTimestamp.priority = timestampPriority;
            bestTimestamp.time = timestampTime;
        }
    }

    return bestTimestamp;
}

function getPriority(eventSource: string) {
    return eventSourcePriorities.get(eventSource) || DEFAULT_PRIORITY;
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
    readonly portcallId?: number | null
}

export function mergeTimestamps(timestamps: MergeableTimestamp[]): MergeableTimestamp[] {
    let ret: MergeableTimestamp[] = timestamps;

    // group by portcall id
    const byPortcallId: MergeableTimestamp[][] = R.compose(R.values, R.groupBy((ts: MergeableTimestamp) => ts.portcallId!.toString()))(timestamps);

    let needToSort = false;

    for (const portcallTimestamps of byPortcallId) {
        const vts_a = portcallTimestamps.filter(t => vtsASources.includes(t.source));
        if (vts_a.length > 1) {

            // build an average timestamp and discard the rest
            // use the source with the highest priority
            ret = ret.filter(t => !vts_a.includes(t));
            const highestPriority = R.last(R.sortBy((ts => eventSourcePriorities.get(ts.source)!), vts_a))!;
            ret.push({ ...highestPriority, ...{
                eventTime: momentAverage(vts_a.map(ts => moment(ts.eventTime)))
            }});
            needToSort = true;
        }

    }

    // re-sort as timestamp places can change after merging
    return needToSort ? R.sortBy((ts) => moment(ts.eventTime).valueOf(), ret) : ret;
}
