import type {
    DB_REQUEST_FIELD,
    DB_TRANSPORT_TYPE_FIELD,
    OS_ACCOUNT_NAME_FIELD,
    OS_REQUEST_FIELD,
    TransportType
} from "./constants.js";

export type DbTransportTypeFilter = `${typeof DB_TRANSPORT_TYPE_FIELD}:${TransportType}`;
export type DbUriFilter = `${typeof DB_REQUEST_FIELD}:\\"${string}\\"`;
export type DbFilter = `${DbTransportTypeFilter}${"" | ` AND ${DbUriFilter}`}`;

export type OsAccountNameFilter = `${
    | `${typeof OS_ACCOUNT_NAME_FIELD}:${string}`
    | `(${typeof OS_ACCOUNT_NAME_FIELD}:${string} OR ${typeof OS_ACCOUNT_NAME_FIELD}:${string} OR ${typeof OS_ACCOUNT_NAME_FIELD}:${string})`}`;
export type OsUriFilter = `${typeof OS_REQUEST_FIELD}:\\"${string}*\\"`;
export type OsFilter = `${OsAccountNameFilter}${"" | ` AND ${OsUriFilter}`}`;
