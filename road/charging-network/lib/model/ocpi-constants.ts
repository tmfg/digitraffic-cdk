import { VersionString } from "../api/ocpi/ocpi-api-responses";

// export enum OcpiModule {
//     CREDENTIALS = "credentials",
//     LOCATIONS = "locations"
//}
export const OCPI_MODULE_CREDENTIALS = "credentials" as const;
export const OCPI_MODULE_LOCATIONS = "locations" as const;
export type OcpiModule = typeof OCPI_MODULE_CREDENTIALS | typeof OCPI_MODULE_LOCATIONS;

export const VERSION_2_0: VersionString = "2.0" as const;
export const VERSION_2_1_1: VersionString = "2.1.1" as const; // We support only this at the moment
export const VERSION_2_2: VersionString = "2.2" as const;
export const VERSION_2_2_1: VersionString = "2.2.1" as const;

export const SUPPORTED_VERSIONS = [VERSION_2_1_1];
