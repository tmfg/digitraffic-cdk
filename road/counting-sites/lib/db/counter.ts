import {IDatabase, PreparedStatement } from "pg-promise";
import {DbCounter, DbDomain} from "../model/domain";
import {ApiCounter} from "../model/counter";

const SQL_ALL_DOMAINS =
    `select name, description, added_timestamp, removed_timestamp
    from counting_site_domain order by name`;

const SQL_ALL_COUNTERS =
    `select id, site_id, domain_name, site_domain, name, location, user_type_id, interval, direction, added_timestamp, last_data_timestamp, removed_timestamp
    from counting_site_counter order by id`;

const SQL_ALL_COUNTERS_FOR_DOMAIN =
    `select id, site_id, domain_name, site_domain, name, location, user_type_id, interval, direction, added_timestamp, last_data_timestamp, removed_timestamp
    from counting_site_counter where domain_name = $1 order by id`;

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

const SQL_FIND_DOMAIN =
    `select name, description, added_timestamp, removed_timestamp
    from counting_site_domain where name=$1`;

const PS_ALL_DOMAINS = new PreparedStatement({
    name: 'select-domains',
    text: SQL_ALL_DOMAINS,
});

const PS_ALL_COUNTERS = new PreparedStatement({
    name: 'select-counters',
    text: SQL_ALL_COUNTERS,
});

const PS_ALL_COUNTERS_FOR_DOMAIN = new PreparedStatement({
    name: 'select-counters-for-domain',
    text: SQL_ALL_COUNTERS_FOR_DOMAIN,
});

const PS_INSERT_COUNTER = new PreparedStatement({
   name: 'insert-counter',
   text: SQL_INSERT_COUNTER
});

const PS_REMOVE_COUNTERS = new PreparedStatement({
    name: 'remove-counters',
    text: SQL_REMOVE_COUNTERS
});

const PS_UPDATE_COUNTER = new PreparedStatement({
    name: 'update-counter',
    text: SQL_UPDATE_COUNTER
});

const PS_FIND_DOMAIN = new PreparedStatement({
    name: 'find-domain',
    text: SQL_FIND_DOMAIN
});

const PS_UPDATE_COUNTER_TIMESTAMP = new PreparedStatement({
    name: 'update-counter-timestamp',
    text: SQL_UPDATER_COUNTER_TIMESTAMP
});

export function findAllDomains(db: IDatabase<any, any>): Promise<DbDomain[]> {
    return db.manyOrNone(PS_ALL_DOMAINS);
}

export function findAllCounters(db: IDatabase<any, any>): Promise<DbCounter[]> {
    return db.manyOrNone(PS_ALL_COUNTERS);
}

export function findAllCountersForDomain(db: IDatabase<any, any>, domain: string): Promise<DbCounter[]> {
    return db.manyOrNone(PS_ALL_COUNTERS_FOR_DOMAIN, [domain]);
}

export function insertCounters(db: IDatabase<any, any>, domain: string, counters: ApiCounter[]): Promise<any> {
    return Promise.all(counters
        .map(c => db.none(PS_INSERT_COUNTER,
            [c.id, domain, c.domain, c.name, `POINT(${c.longitude} ${c.latitude})`, c.userType, c.interval, c.sens]))
    );
}

export function removeCounters(db: IDatabase<any, any>, counters: DbCounter[]): Promise<any> {
    if(counters.length > 0) {
        return db.none(SQL_REMOVE_COUNTERS, [counters.map(c => c.id)]);
    }

    return Promise.resolve();
}

export function updateCounters(db: IDatabase<any, any>, counters: ApiCounter[]): Promise<any> {
    return Promise.all(counters
        .map(c => db.none(PS_UPDATE_COUNTER, [c.domain, `POINT(${c.longitude} ${c.latitude})`,c.interval, c.sens, c.id]))
    );
}

export function updateCounterTimestamp(db: IDatabase<any, any>, counterId: number, timestamp: Date): Promise<any> {
    return db.none(PS_UPDATE_COUNTER_TIMESTAMP, [timestamp, counterId]);
}

export function getDomain(db: IDatabase<any, any>, domainName: string): Promise<DbDomain|null> {
    return db.oneOrNone(PS_FIND_DOMAIN, [domainName]);
}
