/**
 * Service enum representing the different Digitraffic services.
 * Renamed from ServiceDomain to avoid confusion with DDD "domain" term.
 */
export enum Service {
  ALL = "*",
  RAIL = "rail",
  ROAD = "road",
  MARINE = "marine",
  AFIR = "afir",
}

/**
 * Parse a string to a Service enum value.
 * @throws Error if the string doesn't match any Service value
 */
export function parseService(value: string): Service {
  const normalized = value.toLowerCase();
  switch (normalized) {
    case "*":
      return Service.ALL;
    case "rail":
      return Service.RAIL;
    case "road":
      return Service.ROAD;
    case "marine":
      return Service.MARINE;
    case "afir":
      return Service.AFIR;
    default:
      throw new Error(`Unknown service: ${value}`);
  }
}
