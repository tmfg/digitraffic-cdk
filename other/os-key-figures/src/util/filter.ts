import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import type { OsAccountNameFilter, TransportType } from "../lambda/collect-os-key-figures.js";

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
    if (transportTypeName.trim() === "*") {
        return `(accountName.keyword:${RAIL_ACCOUNT_NAME} OR accountName.keyword:${ROAD_ACCOUNT_NAME} OR accountName.keyword:${MARINE_ACCOUNT_NAME})`;
    } else if (transportTypeName.trim() === "marine") {
        return `accountName.keyword:${MARINE_ACCOUNT_NAME}`;
    } else if (transportTypeName.trim() === "rail") {
        return `accountName.keyword:${RAIL_ACCOUNT_NAME}`;
    } else if (transportTypeName.trim() === "road") {
        return `accountName.keyword:${ROAD_ACCOUNT_NAME}`;
    } else return undefined;
}

// without using .keyword for filtering request URIs, OpenSearch query strings will produce unfortunate partial matches
// at the same time, some URIs in the logs have trailing slashes while others do not, hence the OR statement for two versions of the same URI below
export function getOsUriFilterFromPath(path: string) {
    if (path.trim().endsWith("/")) {
        return `(request.keyword:\\"${path}\\" OR request.keyword:\\"${path.replace(/\/$/, "")}\\")`;
    } else return `(request.keyword:\\"${path}\/\\" OR request.keyword:\\"${path}\\")`;
}
