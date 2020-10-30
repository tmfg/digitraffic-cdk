const eventSourceMap = new Map<string, string>([
    ["Portnet", "PNET"],
    ["VTS", "VTS A"]
]);

export function getDisplayableNameForEventSource(eventSource: string): string {
    return eventSourceMap.get(eventSource) || eventSource;
}

export function getBestEstimate<T>(portnet: T | null, vts: T | null): T {
    return vts || portnet as T;
}