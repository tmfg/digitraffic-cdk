import {ApiTimestamp} from "./model/timestamp";

export const EVENTSOURCE_VTS = "VTS";
export const EVENTSOURCE_PORTNET = "Portnet";
export const EVENTSOURCE_PORT_HANKO = "Port HKO";
export const EVENTSOURCE_TEQPLAY = "Teqplay";
export const EVENTSOURCE_SCHEDULES_VTS_CONTROL = 'SCHEDULES_VTS_CONTROLLED';
export const EVENTSOURCE_SCHEDULES_CALCULATED = 'SCHEDULES_CALCULATED';

const DEFAULT_PRIORITY = -1;

const eventSourceMap = new Map<string, string>([
    [EVENTSOURCE_PORTNET, "PNET"],
    [EVENTSOURCE_VTS, "VTS A"],
    [EVENTSOURCE_PORT_HANKO, EVENTSOURCE_PORT_HANKO],
    [EVENTSOURCE_TEQPLAY, "VTS A"],
    [EVENTSOURCE_SCHEDULES_VTS_CONTROL, 'VTS O'],
    [EVENTSOURCE_SCHEDULES_CALCULATED, 'VTS A']
]);

const eventSourcePriorities = new Map<string, number>([
    [EVENTSOURCE_PORTNET, 10],
    [EVENTSOURCE_VTS, 80],
    [EVENTSOURCE_TEQPLAY, 85],
    [EVENTSOURCE_SCHEDULES_CALCULATED, 90],
    [EVENTSOURCE_SCHEDULES_VTS_CONTROL, 95],
    [EVENTSOURCE_PORT_HANKO, 100]
]);

export function isPortnetTimestamp(timestamp: ApiTimestamp) {
    return timestamp.source == EVENTSOURCE_PORTNET;
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
