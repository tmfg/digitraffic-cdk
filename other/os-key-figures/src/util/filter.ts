import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { type DbUriFilter, type OsAccountNameFilter, type OsUriFilter } from "../filter-types.js";

import { DB_REQUEST_FIELD, OS_REQUEST_FIELD, transportType, type TransportType } from "../constants.js";

const MARINE_ACCOUNT_NAME = getEnvVariable("MARINE_ACCOUNT_NAME");
const RAIL_ACCOUNT_NAME = getEnvVariable("RAIL_ACCOUNT_NAME");
const ROAD_ACCOUNT_NAME = getEnvVariable("ROAD_ACCOUNT_NAME");

export const ALL_ACCOUNTS_FILTER_REGEX = /^\(.* OR .* OR .*\)/;
const MARINE_ACCOUNT_FILTER_REGEX = new RegExp(`^accountName.keyword:${MARINE_ACCOUNT_NAME}`);
const ROAD_ACCOUNT_FILTER_REGEX = new RegExp(`^accountName.keyword:${ROAD_ACCOUNT_NAME}`);
const RAIL_ACCOUNT_FILTER_REGEX = new RegExp(`^accountName.keyword:${RAIL_ACCOUNT_NAME}`);

export function getTransportTypeDbFilterFromAccountNameFilter(filter: string): string | undefined {
    if (
        filter.includes(RAIL_ACCOUNT_NAME) &&
        filter.includes(ROAD_ACCOUNT_NAME) &&
        filter.includes(MARINE_ACCOUNT_NAME) &&
        filter.match(ALL_ACCOUNTS_FILTER_REGEX)
    ) {
        return filter.replace(ALL_ACCOUNTS_FILTER_REGEX, "@transport_type:*");
    } else if (filter.match(MARINE_ACCOUNT_FILTER_REGEX)) {
        return filter.replace(MARINE_ACCOUNT_FILTER_REGEX, "@transport_type:marine");
    } else if (filter.match(RAIL_ACCOUNT_FILTER_REGEX)) {
        return filter.replace(RAIL_ACCOUNT_FILTER_REGEX, "@transport_type:rail");
    } else if (filter.match(ROAD_ACCOUNT_FILTER_REGEX)) {
        return filter.replace(ROAD_ACCOUNT_FILTER_REGEX, "@transport_type:road");
    } else return undefined;
}

export function getAccountNameOsFilterFromTransportTypeName(
    transportTypeName: TransportType
): OsAccountNameFilter | undefined {
    if (transportTypeName.trim() === transportType.ALL) {
        return `(accountName.keyword:${RAIL_ACCOUNT_NAME} OR accountName.keyword:${ROAD_ACCOUNT_NAME} OR accountName.keyword:${MARINE_ACCOUNT_NAME})`;
    } else if (transportTypeName.trim() === transportType.MARINE) {
        return `accountName.keyword:${MARINE_ACCOUNT_NAME}`;
    } else if (transportTypeName.trim() === transportType.RAIL) {
        return `accountName.keyword:${RAIL_ACCOUNT_NAME}`;
    } else if (transportTypeName.trim() === transportType.ROAD) {
        return `accountName.keyword:${ROAD_ACCOUNT_NAME}`;
    } else return undefined;
}

export function getUriFiltersFromPath(path: string): { osFilter: OsUriFilter; dbFilter: DbUriFilter } {
    return {
        // Remove trailing slash from path received from swagger, some have them. It is unclear if all paths in swagger
        // correspond to paths in log lines. Removing the slash should produce the correct match
        osFilter: `${OS_REQUEST_FIELD}:\\"${path.replace(/\/$/, "")}\\"`,
        dbFilter: `${DB_REQUEST_FIELD}:\\"${path}\\"`
    };
}
