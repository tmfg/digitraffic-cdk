import { TrafficType } from "@digitraffic/common/dist/types/traffictype";

/**
 * Removes app name from the given string
 * @param text to remove app name
 */
export function removeAppAndTrim(text: string): string {
    for (const appName of [TrafficType.ROAD, TrafficType.MARINE, TrafficType.RAIL]) {
        const app = appName.toLowerCase();
        if (
            text.startsWith(`${app}`) ||
            text.startsWith(`/${app}`) ||
            text.startsWith(`${appName}`) ||
            text.startsWith(`/${appName}`)
        ) {
            return text.replace(appName, "").replace(app, "").replace("//", "/").trim();
        }
    }
    return text.trim();
}
