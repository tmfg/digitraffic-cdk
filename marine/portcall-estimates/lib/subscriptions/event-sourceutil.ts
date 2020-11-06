import {ShiplistEstimate} from "./db/db-shiplist";

export const EVENTSOURCE_VTS = "VTS";
export const EVENTSOURCE_PORTNET = "Portnet";

const eventSourceMap = new Map<string, string>([
    [EVENTSOURCE_PORTNET, "PNET"],
    [EVENTSOURCE_VTS, "VTS A"]
]);

export function getDisplayableNameForEventSource(eventSource: string): string {
    return eventSourceMap.get(eventSource) || eventSource;
}

export function getBestEstimate<T>(portnet: T | null, vts: T | null): T {
    return vts || portnet as T;
}

export function selectBetterEstimate(first: ShiplistEstimate, second: ShiplistEstimate): ShiplistEstimate {
    console.info("selecting from %s and %s", first.event_source, second.event_source);

    if(first.event_source === EVENTSOURCE_VTS) return first;

    return second;
}