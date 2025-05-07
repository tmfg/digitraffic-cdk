import pg from "pg-promise";
import type { DTDatabase, DTTransaction } from "./database.js";

const { PreparedStatement } = pg;

export interface CachedValue<T> {
  content: T;
  last_updated: Date;
  modified: Date;
}

const PS_UPDATE_CACHE_VALUE = new PreparedStatement({
  name: "update-cache-value",
  text: `insert into cached_json(cache_id, content, last_updated)
    values ($1, $2, $3)
    on conflict(cache_id) do
    update set content = $2, last_updated = $3`,
});

const PS_GET_CACHE_VALUE = new PreparedStatement({
  name: "get-cache-value",
  text:
    "select content, last_updated, modified from cached_json where cache_id = $1",
});

export enum JSON_CACHE_KEY {
  NAUTICAL_WARNINGS_ACTIVE = "nautical-warnings-active",
  NAUTICAL_WARNINGS_ARCHIVED = "nautical-warnings-archived",
}

/**
 * @param db
 * @param cacheKey
 * @param value
 * @param lastUpdated time when data was created or updated
 */
export async function updateCachedJson<T>(
  db: DTDatabase | DTTransaction,
  cacheKey: JSON_CACHE_KEY,
  value: T,
  lastUpdated: Date,
): Promise<void> {
  await db.none(PS_UPDATE_CACHE_VALUE, [cacheKey, value, lastUpdated]);
}

export function getJsonFromCache<T>(
  db: DTDatabase | DTTransaction,
  cacheKey: JSON_CACHE_KEY,
): Promise<T | undefined> {
  return db
    .oneOrNone<CachedValue<T>>(PS_GET_CACHE_VALUE, [cacheKey])
    .then((value) => value?.content ?? undefined);
}

export async function getFromCache<T>(
  db: DTDatabase | DTTransaction,
  cacheKey: JSON_CACHE_KEY,
): Promise<CachedValue<T> | undefined> {
  return db.oneOrNone<CachedValue<T>>(PS_GET_CACHE_VALUE, [cacheKey]).then(
    (result) => {
      return result ?? undefined;
    },
  );
}
