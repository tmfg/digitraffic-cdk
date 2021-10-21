import {IDatabase, PreparedStatement} from "pg-promise";

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
    text: SQL_UPDATE_CACHE_VALUE
})

const PS_GET_CACHE_VALUE = new PreparedStatement({
    name: 'get-cache-value',
    text: SQL_GET_CACHE_VALUE
})

export enum JSON_CACHE_KEY {
    NAUTICAL_WARNINGS_ACTIVE = 'nautical-warnings-active',
    NAUTICAL_WARNINGS_ARCHIVED = 'nautical-warnings-archived'
}

export function updateCachedJson(db: IDatabase<any, any>, cacheKey: JSON_CACHE_KEY, value: any): Promise<any> {
    return db.none(PS_UPDATE_CACHE_VALUE, [cacheKey, value]);
}

export function getJsonFromCache(db: IDatabase<any, any>, cacheKey: JSON_CACHE_KEY): Promise<any> {
    return db.oneOrNone(PS_GET_CACHE_VALUE, [cacheKey]).then(value => value?.content ?? null);
}