import { TrafficType } from "@digitraffic/common/dist/types/traffictype";

/**
 * Removes app name from the given string and strips trailing slash
 * @param text to remove app name
 */
export function removeAppAndTrim(text: string): string {
  for (const appName of [
    TrafficType.ROAD,
    TrafficType.MARINE,
    TrafficType.RAIL,
    TrafficType.PARKING,
    TrafficType.CATALOG,
  ]) {
    const app = appName.toLowerCase();
    if (
      text.startsWith(`${app}`) ||
      text.startsWith(`/${app}`) ||
      text.startsWith(`${appName}`) ||
      text.startsWith(`/${appName}`)
    ) {
      return text
        .replace(appName, "")
        .replace(app, "")
        .replace("//", "/")
        .trim();
    }
  }
  return text.trim();
}

export function removeTrailingSlash(text: string): string {
  return text.endsWith("/") ? text.slice(0, -1) : text;
}
