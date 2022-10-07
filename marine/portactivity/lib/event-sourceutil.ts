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

export const VTS_TIMESTAMP_TOO_OLD_MINUTES = 60;
export const VTS_TIMESTAMP_DIFF_MINUTES = 60;

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
    readonly recordTime: string
    readonly source: string
    readonly eventType: EventType
    readonly portcallId?: number | null
}

function momentsDifferByMinutes(moment1: Moment, moment2: Moment, maxDiffMinutes: number) {
    const diffMinutes = Math.ceil(moment.duration(moment1.diff(moment2)).asMinutes());
    return diffMinutes >= maxDiffMinutes;
}

/**
 * Checks if certain types of timestamps from an equivalent source can be merged.
 * @param timestamps
 */
export function mergeTimestamps(timestamps: MergeableTimestamp[]): MergeableTimestamp[] {
    const ret: MergeableTimestamp[] = [];

    // group by portcall id and event type
    const byPortcallId: MergeableTimestamp[][] = R.compose(R.values,
        R.groupBy((ts: MergeableTimestamp) => (ts.portcallId as number).toString() + ts.eventType))(timestamps);

    // timestamps relating to specific port call
    for (const portcallTimestamps of byPortcallId) {
        let addToList = [...portcallTimestamps];
        let vtsAStamps = portcallTimestamps.filter(t => vtsASources.includes(t.source));

        // special handling for out-of-date or incorrect VTS timestamps
        const vtsTimestamp = vtsAStamps.find(t => t.source === EventSource.SCHEDULES_CALCULATED);
        if (vtsTimestamp) {
            const awakeTimestamp = vtsAStamps.find(t => t.source === EventSource.AWAKE_AI);
            if (momentsDifferByMinutes(moment(), moment(vtsTimestamp.recordTime), VTS_TIMESTAMP_TOO_OLD_MINUTES) ||
                (awakeTimestamp && momentsDifferByMinutes(moment(vtsTimestamp.eventTime), moment(awakeTimestamp.eventTime), VTS_TIMESTAMP_DIFF_MINUTES))) {
                // remove only VTS timestamp
                addToList = addToList.filter(t => !R.equals(t, vtsTimestamp));
                vtsAStamps = vtsAStamps.filter(t => !R.equals(t, vtsTimestamp));
            }
        }

        // filter out any worse quality PRED estimates if VTS A estimates are available
        if (vtsAStamps.length) {
            addToList = addToList.filter(t => t.source !== EventSource.AWAKE_AI_PRED);
        }

        // build an average timestamp from the calculated timestamps and discard the rest
        // use the source with the highest priority
        if (vtsAStamps.length > 1) {
            addToList = addToList.filter(t => !vtsAStamps.includes(t));
            const highestPriority = R.last(R.sortBy((ts => eventSourcePriorities.get(ts.source) as number), vtsAStamps)) as MergeableTimestamp;
            addToList.push({
                ...highestPriority, ...{
                    eventTime: momentAverage(vtsAStamps.map(ts => moment(ts.eventTime))),
                },
            });
        }

        ret.push(...addToList);
    }

    return R.sortBy((ts) => moment(ts.eventTime).valueOf(), ret);
}
