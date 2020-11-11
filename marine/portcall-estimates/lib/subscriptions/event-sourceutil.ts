import {ShiplistEstimate} from "./db/db-shiplist";

export const EVENTSOURCE_VTS = "VTS";
export const EVENTSOURCE_PORTNET = "Portnet";
export const EVENTSOURCE_PORT_HANKO = "Port HKO";

const DEFAULT_PRIORITY = -1;

const eventSourceMap = new Map<string, string>([
    [EVENTSOURCE_PORTNET, "PNET"],
    [EVENTSOURCE_VTS, "VTS A"],
    [EVENTSOURCE_PORT_HANKO, EVENTSOURCE_PORT_HANKO]
]);

const eventSourcePriorities = new Map<string, number>([
    [EVENTSOURCE_PORTNET, 10],
    [EVENTSOURCE_VTS, 80],
    [EVENTSOURCE_PORT_HANKO, 100]
]);

export function getDisplayableNameForEventSource(eventSource: string): string {
    return eventSourceMap.get(eventSource) || eventSource;
}

export function selectBestEstimate(estimate: any): any {
    let bestEstimate = {} as any;

    for(const sourceName of Object.keys(estimate)) {
        const estimateTime = estimate[sourceName];
        const estimatePriority = getPriority(sourceName);

        if(typeof bestEstimate.priority === 'undefined' || bestEstimate.priority < estimatePriority) {
            bestEstimate.source = sourceName;
            bestEstimate.priority = estimatePriority;
            bestEstimate.time = estimateTime;
        }
    }

    return bestEstimate;
}

function getPriority(eventSource: string) {
    return eventSourcePriorities.get(eventSource) || DEFAULT_PRIORITY;
}

export function selectBetterEstimate(first: ShiplistEstimate, second: ShiplistEstimate): ShiplistEstimate {
//    console.info("selecting from %s and %s", first.event_source, second.event_source);

    const firstPriority = getPriority(first.event_source);
    const secondPriority = getPriority(second.event_source);

    return firstPriority > secondPriority ? first : second;
}