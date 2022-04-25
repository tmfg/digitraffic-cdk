import {PreparedStatement} from "pg-promise";
import {DTDatabase, DTTransaction} from "./database";

const SQL_UPDATE_CACHE_VALUE =
    `insert into cached_json(cache_id, content, last_updated)
    values ($1, $2, now())
    on conflict(cache_id) do
    update set content = $2, last_updated = now()`;

const SQL_GET_CACHE_VALUE =
    `select content, last_updated from cached_json
    where cache_id = $1`;

const PS_UPDATE_CACHE_VALUE = new PreparedStatement({
    name: 'update-cache-value',
    text: SQL_UPDATE_CACHE_VALUE,
});

const PS_GET_CACHE_VALUE = new PreparedStatement({
    name: 'get-cache-value',
    text: SQL_GET_CACHE_VALUE,
});

export enum JSON_CACHE_KEY {
    NAUTICAL_WARNINGS_ACTIVE = 'nautical-warnings-active',
    NAUTICAL_WARNINGS_ARCHIVED = 'nautical-warnings-archived'
}

export function updateCachedJson<T>(db: DTDatabase | DTTransaction, cacheKey: JSON_CACHE_KEY, value: T): Promise<null> {
    return db.none(PS_UPDATE_CACHE_VALUE, [cacheKey, value]);
}

export function getJsonFromCache<T>(db: DTDatabase | DTTransaction, cacheKey: JSON_CACHE_KEY): Promise<T | null> {
    return db.oneOrNone(PS_GET_CACHE_VALUE, [cacheKey]).then(value => value?.content ?? null);
}
