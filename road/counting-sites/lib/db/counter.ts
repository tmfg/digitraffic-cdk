import {PreparedStatement} from "pg-promise";
import {ApiCounter, DbCounter} from "../model/counter";
import {FeatureCollection} from "geojson";
import {DTDatabase} from "digitraffic-common/database/database";

const SQL_ALL_COUNTERS =
    `select id, site_id, domain_name, site_domain, name, ST_Y(location::geometry) as lat, ST_Y(location::geometry) as lon, user_type_id, interval, direction, added_timestamp, last_data_timestamp, removed_timestamp
    from counting_site_counter
    where domain_name = $1
    order by id`;

const SQL_ALL_COUNTERS_FOR_DOMAIN =
    `select json_build_object(
                    'type', 'FeatureCollection',
                    'features', json_agg(
                            json_build_object(
                                    'type', 'Feature',
                                    'geometry', ST_AsGeoJSON(location::geometry)::json,
                                    'properties', json_build_object(
                                            'id', id,
                                            'name', name,
                                            'siteId', site_id,
                                            'userType', user_type_id,
                                            'interval', interval,
                                            'direction', direction,
                                            'lastDataTimestamp', last_data_timestamp,
                                            'removedTimestamp', removed_timestamp
                                        )
                                )
                        )
                ) as collection
     from counting_site_counter
     where domain_name = $1`;

const SQL_INSERT_COUNTER =
    `insert into counting_site_counter(id, site_id, domain_name, site_domain, name, location, user_type_id, interval, direction, added_timestamp)
    values (NEXTVAL('counting_site_counter_id_seq'), $1, $2, $3, $4, $5, $6, $7, $8, now())`;

const SQL_REMOVE_COUNTERS =
    `update counting_site_counter
    set removed_timestamp = now()
    where id in ($1:list)`;

const SQL_UPDATE_COUNTER =
    `update counting_site_counter
    set site_domain=$1,
        location=$2,
        interval=$3,
        direction=$4
    where id=$5`;

const SQL_UPDATER_COUNTER_TIMESTAMP =
    `update counting_site_counter
    set last_data_timestamp=$1
    where id=$2`;

const PS_ALL_COUNTERS = new PreparedStatement({
    name: 'select-counters',
    text: SQL_ALL_COUNTERS,
});

const PS_ALL_COUNTERS_FOR_DOMAIN_FEATURE_COLLECTION = new PreparedStatement({
    name: 'select-counters-for-domain',
    text: SQL_ALL_COUNTERS_FOR_DOMAIN,
});

const PS_INSERT_COUNTER = new PreparedStatement({
    name: 'insert-counter',
    text: SQL_INSERT_COUNTER,
});

const PS_UPDATE_COUNTER = new PreparedStatement({
    name: 'update-counter',
    text: SQL_UPDATE_COUNTER,
});

const PS_UPDATE_COUNTER_TIMESTAMP = new PreparedStatement({
    name: 'update-counter-timestamp',
    text: SQL_UPDATER_COUNTER_TIMESTAMP,
});

export function findAllCountersForDomain(db: DTDatabase, domain: string): Promise<FeatureCollection> {
    return db.one(PS_ALL_COUNTERS_FOR_DOMAIN_FEATURE_COLLECTION, [domain]).then(r => r.collection);
}

export function findAllCountersForUpdateForDomain(db: DTDatabase, domain: string): Promise<DbCounter[]> {
    return db.manyOrNone(PS_ALL_COUNTERS, [domain]);
}

export function insertCounters(db: DTDatabase, domain: string, counters: ApiCounter[]): Promise<null[]> {
    return Promise.all(counters
        .map(c => db.none(PS_INSERT_COUNTER,
            [c.id, domain, c.domain, c.name, `POINT(${c.longitude} ${c.latitude})`, c.userType, c.interval, c.sens])));
}

export function removeCounters(db: DTDatabase, counters: DbCounter[]): Promise<null> {
    if (counters.length > 0) {
        return db.none(SQL_REMOVE_COUNTERS, [counters.map(c => c.id)]);
    }

    return Promise.resolve(null);
}

export function updateCounters(db: DTDatabase, counters: ApiCounter[]): Promise<null[]> {
    return Promise.all(counters
        .map(c => db.none(PS_UPDATE_COUNTER, [c.domain, `POINT(${c.longitude} ${c.latitude})`,c.interval, c.sens, c.id])));
}

export function updateCounterTimestamp(db: DTDatabase, counterId: number, timestamp: Date): Promise<null> {
    return db.none(PS_UPDATE_COUNTER_TIMESTAMP, [timestamp, counterId]);
}
