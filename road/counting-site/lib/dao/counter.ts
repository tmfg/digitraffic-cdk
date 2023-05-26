import { PreparedStatement } from "pg-promise";
import { ApiCounter, DbCounter } from "../model/counter";
import { FeatureCollection } from "geojson";
import { DTDatabase } from "@digitraffic/common/dist/database/database";

const SQL_ALL_COUNTERS = `select id, site_id, domain_name, site_domain, name, ST_Y(location::geometry) as lat, ST_Y(location::geometry) as lon, user_type_id, interval, direction, created, modified, last_data_timestamp, removed_timestamp
    from counting_site_counter
    where domain_name = $1
    order by id`;

const SQL_ALL_COUNTERS_FEATURE_COLLECTION = `select json_build_object(
                    'type', 'FeatureCollection',
                    'dataUpdatedTime', to_char(coalesce(max(modified), to_timestamp(0)) at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
                    'features', coalesce(json_agg(
                            json_build_object(
                                    'type', 'Feature',
                                    'geometry', ST_AsGeoJSON(location::geometry)::json,
                                    'properties', json_build_object(
                                            'id', id,
                                            'name', name,
                                            'domain', domain_name,
                                            'userType', user_type_id,
                                            'interval', interval,
                                            'direction', direction,
                                            'lastDataTimestamp', to_char(last_data_timestamp at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
                                            'removedTimestamp', to_char(removed_timestamp at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
                                            'dataUpdatedTime', to_char(modified at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
                                        )
                                )
                        ), '[]')
                    ) as collection
     from counting_site_counter
     where (domain_name = $1 or $1 is null)
     and (id = $2 or $2 is null)
     `;

const SQL_INSERT_COUNTER = `insert into counting_site_counter(id, site_id, domain_name, site_domain, name, location, user_type_id, interval, direction)
    values (NEXTVAL('counting_site_counter_id_seq'), $1, $2, $3, $4, $5, $6, $7, $8)`;

const SQL_REMOVE_COUNTERS = `update counting_site_counter
    set removed_timestamp = now()
    where id in ($1:list)`;

const SQL_UPDATE_COUNTER = `update counting_site_counter
    set site_domain=$1,
        location=$2,
        interval=$3,
        direction=$4
    where id=$5`;

const SQL_UPDATER_COUNTER_TIMESTAMP = `update counting_site_counter
    set last_data_timestamp=$1
    where id=$2`;

const PS_ALL_COUNTERS = new PreparedStatement({
    name: "select-counters",
    text: SQL_ALL_COUNTERS
});

const PS_FIND_COUNTERS_FEATURE_COLLECTION = new PreparedStatement({
    name: "select-counters-feature-collection",
    text: SQL_ALL_COUNTERS_FEATURE_COLLECTION
});

const PS_INSERT_COUNTER = new PreparedStatement({
    name: "insert-counter",
    text: SQL_INSERT_COUNTER
});

const PS_UPDATE_COUNTER = new PreparedStatement({
    name: "update-counter",
    text: SQL_UPDATE_COUNTER
});

const PS_UPDATE_COUNTER_TIMESTAMP = new PreparedStatement({
    name: "update-counter-timestamp",
    text: SQL_UPDATER_COUNTER_TIMESTAMP
});

export function nullString(value: string): string | undefined {
    return value === "" ? undefined : value;
}

export function nullNumber(value: string): number | undefined {
    return value === "" ? undefined : Number.parseInt(value);
}

interface DbCollection {
    collection: FeatureCollection;
}

export function findCounters(db: DTDatabase, domain: string, counterId: string): Promise<FeatureCollection> {
    return db
        .one<DbCollection>(PS_FIND_COUNTERS_FEATURE_COLLECTION, [nullString(domain), nullNumber(counterId)])
        .then((r) => r.collection);
}

export function findAllCountersForUpdateForDomain(db: DTDatabase, domain: string): Promise<DbCounter[]> {
    return db.manyOrNone(PS_ALL_COUNTERS, [domain]);
}

export async function insertCounters(db: DTDatabase, domain: string, counters: ApiCounter[]): Promise<void> {
    await Promise.allSettled(
        counters.map((c) =>
            db.none(PS_INSERT_COUNTER, [
                c.id,
                domain,
                c.domain,
                c.name,
                `POINT(${c.longitude} ${c.latitude})`,
                c.userType,
                c.interval,
                c.sens
            ])
        )
    );
}

export async function removeCounters(db: DTDatabase, counters: DbCounter[]): Promise<void> {
    if (counters.length > 0) {
        await db.none(SQL_REMOVE_COUNTERS, [counters.map((c) => c.id)]);
    }
}

export async function updateCounters(db: DTDatabase, counters: ApiCounter[]): Promise<void> {
    await Promise.allSettled(
        counters.map((c) =>
            db.none(PS_UPDATE_COUNTER, [
                c.domain,
                `POINT(${c.longitude} ${c.latitude})`,
                c.interval,
                c.sens,
                c.id
            ])
        )
    );
}

export async function updateCounterTimestamp(
    db: DTDatabase,
    counterId: number,
    timestamp: Date
): Promise<void> {
    await db.none(PS_UPDATE_COUNTER_TIMESTAMP, [timestamp, counterId]);
}
