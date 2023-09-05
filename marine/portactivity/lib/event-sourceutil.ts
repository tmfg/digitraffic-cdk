import { differenceInMinutes, parseISO } from "date-fns";
import * as R from "ramda";
import { EventSource } from "./model/eventsource";
import { ApiTimestamp, PublicApiTimestamp } from "./model/timestamp";

export const VTS_A = "VTS A";
export const VTS_O = "VTS O";
export const PRED = "PRED";

export const eventSourceMap = new Map<string, string>([
    [EventSource.PORTNET, "PNET"],
    [EventSource.AWAKE_AI, VTS_A],
    [EventSource.PORT_HANKO, EventSource.PORT_HANKO],
    [EventSource.SCHEDULES_VTS_CONTROL, VTS_O],
    [EventSource.SCHEDULES_CALCULATED, VTS_A],
    [EventSource.AWAKE_AI_PRED, PRED]
]);

const eventSourcePriorities = new Map<string, number>([
    [EventSource.PORTNET, 10],
    [EventSource.AWAKE_AI_PRED, 40],
    [EventSource.AWAKE_AI, 80],
    [EventSource.SCHEDULES_CALCULATED, 90],
    [EventSource.SCHEDULES_VTS_CONTROL, 95],
    [EventSource.PORT_HANKO, 100]
]);

export const VTS_TIMESTAMP_TOO_OLD_MINUTES = 60;
export const VTS_TIMESTAMP_DIFF_MINUTES = 60;

export function isPortnetTimestamp(timestamp: ApiTimestamp): boolean {
    return timestamp.source === EventSource.PORTNET;
}

export function getDisplayableNameForEventSource(eventSource: string): string {
    return eventSourceMap.get(eventSource) ?? eventSource;
}

const vtsASources: string[] = [];
for (const entry of eventSourceMap.entries()) {
    if (entry[1] === VTS_A) {
        vtsASources.push(entry[0]);
    }
}

export function dateAverage(dates: Date[]): string {
    const averageMillis = dates.reduce((acc, curr) => acc + curr.valueOf(), 0) / dates.length;
    return new Date(averageMillis).toISOString();
}

function datesDifferByMinutes(date1: Date, date2: Date, maxDiffMinutes: number): boolean {
    const diffMinutes = differenceInMinutes(date1, date2, { roundingMethod: "ceil" });
    return diffMinutes >= maxDiffMinutes;
}

/**
 * Checks if certain types of timestamps from an equivalent source can be merged.
 * @param timestamps
 */
export function mergeTimestamps(timestamps: PublicApiTimestamp[]): PublicApiTimestamp[] {
    const ret: PublicApiTimestamp[] = [];

    // group by portcall id and event type
    const byPortcallId: PublicApiTimestamp[][] = R.compose(
        R.values,
        R.groupBy((ts: PublicApiTimestamp) => (ts.portcallId ?? -1).toString() + ts.eventType)
    )(timestamps);

    // timestamps relating to specific port call
    for (const portcallTimestamps of byPortcallId) {
        let addToList = [...portcallTimestamps];
        let vtsAStamps = portcallTimestamps.filter((t) => vtsASources.includes(t.source));

        // special handling for out-of-date or incorrect VTS timestamps
        const vtsTimestamp = vtsAStamps.find((t) => t.source === EventSource.SCHEDULES_CALCULATED);
        if (vtsTimestamp) {
            const awakeTimestamp = vtsAStamps.find((t) => t.source === EventSource.AWAKE_AI);
            if (
                datesDifferByMinutes(
                    new Date(),
                    parseISO(vtsTimestamp.recordTime),
                    VTS_TIMESTAMP_TOO_OLD_MINUTES
                ) ||
                (awakeTimestamp &&
                    datesDifferByMinutes(
                        parseISO(vtsTimestamp.eventTime),
                        parseISO(awakeTimestamp.eventTime),
                        VTS_TIMESTAMP_DIFF_MINUTES
                    ))
            ) {
                // remove only VTS timestamp
                addToList = addToList.filter((t) => !R.equals(t, vtsTimestamp));
                vtsAStamps = vtsAStamps.filter((t) => !R.equals(t, vtsTimestamp));
            }
        }

        // filter out any worse quality PRED estimates if VTS A estimates are available
        if (vtsAStamps.length) {
            addToList = addToList.filter((t) => t.source !== EventSource.AWAKE_AI_PRED);
        }

        // build an average timestamp from the calculated timestamps and discard the rest
        // use the source with the highest priority
        if (vtsAStamps.length > 1) {
            addToList = addToList.filter((t) => !vtsAStamps.includes(t));

            const highestPriority = vtsAStamps.sort(
                (a, b) =>
                    (eventSourcePriorities.get(b.source) ?? 0) - (eventSourcePriorities.get(a.source) ?? 0)
            )[0];

            addToList.push({
                ...highestPriority,
                ...{
                    eventTime: dateAverage(vtsAStamps.map((ts) => parseISO(ts.eventTime)))
                }
            });
        }

        ret.push(...addToList);
    }

    return R.sortBy((ts) => parseISO(ts.eventTime).valueOf(), ret);
}
