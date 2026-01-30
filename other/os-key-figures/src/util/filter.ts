import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import type { TransportType } from "../constants.js";
import {
  DB_REQUEST_FIELD,
  OS_REQUEST_FIELD,
  transportType,
} from "../constants.js";
import type {
  DbUriFilter,
  OsAccountNameFilter,
  OsUriFilter,
} from "../filter-types.js";

const MARINE_ACCOUNT_NAME = getEnvVariable("MARINE_ACCOUNT_NAME");
const RAIL_ACCOUNT_NAME = getEnvVariable("RAIL_ACCOUNT_NAME");
const ROAD_ACCOUNT_NAME = getEnvVariable("ROAD_ACCOUNT_NAME");
const AFIR_ACCOUNT_NAME = getEnvVariable("AFIR_ACCOUNT_NAME");

export const ALL_ACCOUNTS_FILTER_REGEX = /^\(.* OR .* OR .*\)/;

export function getAccountNameOsFilterFromTransportTypeName(
  transportTypeName: TransportType,
): OsAccountNameFilter | undefined {
  if (transportTypeName.trim() === transportType.ALL) {
    return `(accountName.keyword:${RAIL_ACCOUNT_NAME} OR accountName.keyword:${ROAD_ACCOUNT_NAME} OR accountName.keyword:${MARINE_ACCOUNT_NAME} OR accountName.keyword:${AFIR_ACCOUNT_NAME})`;
  } else if (transportTypeName.trim() === transportType.MARINE) {
    return `accountName.keyword:${MARINE_ACCOUNT_NAME}`;
  } else if (transportTypeName.trim() === transportType.RAIL) {
    return `accountName.keyword:${RAIL_ACCOUNT_NAME}`;
  } else if (transportTypeName.trim() === transportType.ROAD) {
    return `accountName.keyword:${ROAD_ACCOUNT_NAME}`;
  } else if (transportTypeName.trim() === transportType.AFIR) {
    return `accountName.keyword:${AFIR_ACCOUNT_NAME}`;
  } else return undefined;
}

export function getUriFiltersFromPath(path: string): {
  osFilter: OsUriFilter;
  dbFilter: DbUriFilter;
} {
  return {
    // Remove trailing slash from path received from swagger, some have them. It is unclear if all paths in swagger
    // correspond to paths in log lines. Removing the slash and adding a wildcard should produce the correct match
    osFilter: `${OS_REQUEST_FIELD}:\\"${path.replace(/\/$/, "")}*\\"`,
    dbFilter: `${DB_REQUEST_FIELD}:\\"${path}\\"`,
  };
}
