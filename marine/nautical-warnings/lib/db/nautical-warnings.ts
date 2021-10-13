import {IDatabase} from "pg-promise";

const SQL_UPDATE_CACHE_VALUE =
    `insert into cached_json(cache_id, content, last_updated)
    values ($1, $2, now())
    on conflict(cache_id) do
    update set content = $2, last_updated = now()`;

const SQL_GET_CACHE_VALUE =
    `select content, last_updated from cached_json
    where cache_id = $1`;

export function updateCache(db: IDatabase<any, any>, cacheKey: string, value: any): Promise<any> {
    return db.none(SQL_UPDATE_CACHE_VALUE, [cacheKey, value]);
}

export function getValueFromCache(db: IDatabase<any, any>, cacheKey: string): Promise<string> {
    return db.oneOrNone(SQL_GET_CACHE_VALUE, [cacheKey]).then(value => value?.content ?? '');
}