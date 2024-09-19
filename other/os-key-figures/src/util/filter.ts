import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";

const MARINE_ACCOUNT_NAME = getEnvVariable("MARINE_ACCOUNT_NAME");
const RAIL_ACCOUNT_NAME = getEnvVariable("RAIL_ACCOUNT_NAME");
const ROAD_ACCOUNT_NAME = getEnvVariable("ROAD_ACCOUNT_NAME");

export const ALL_ACCOUNTS_FILTER_REGEX = /^\(.* OR .* OR .*\)/;
const MARINE_ACCOUNT_FILTER_REGEX = new RegExp(`^accountName.keyword:${MARINE_ACCOUNT_NAME}`);
const ROAD_ACCOUNT_FILTER_REGEX = new RegExp(`^accountName.keyword:${ROAD_ACCOUNT_NAME}`);
const RAIL_ACCOUNT_FILTER_REGEX = new RegExp(`^accountName.keyword:${RAIL_ACCOUNT_NAME}`);

export function getTransportTypeFilterFromAccountNameFilter(filter: string): string | undefined {
    if (
        filter.includes(RAIL_ACCOUNT_NAME) &&
        filter.includes(ROAD_ACCOUNT_NAME) &&
        filter.includes(MARINE_ACCOUNT_NAME) &&
        filter.match(ALL_ACCOUNTS_FILTER_REGEX)
    ) {
        return "@transport_type:*";
    } else if (filter.match(MARINE_ACCOUNT_FILTER_REGEX)) {
        return "@transport_type:marine";
    } else if (filter.match(RAIL_ACCOUNT_FILTER_REGEX)) {
        return "@transport_type:rail";
    } else if (filter.match(ROAD_ACCOUNT_FILTER_REGEX)) {
        return "@transport_type:road";
    } else return undefined;
}

export function getAccountNameFilterFromTransportTypeName(transportTypeName: string): string | undefined {
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
