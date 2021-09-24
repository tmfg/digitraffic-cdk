import {IDatabase, PreparedStatement } from "pg-promise";
import {Geometry} from "wkx";

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
    values (NEXTVAL('counting_site_counter_id_seq'), $1, $2, $3, $4, $5, $6, $7, $8, current_date)`;

const SQL_REMOVE_COUNTERS =
    `update counting_site_counter
    set removed_timestamp = current_date
    where id in ($1:list)`;

const SQL_UPDATE_COUNTER =
    `update counting_site_counter
    set site_domain=$1,
        location=$2,
        interval=$3,
        direction=$4
    where id=$5`;

const SQL_FIND_DOMAIN =
    `select name, description, added_timestamp, removed_timestamp
    from counting_site_domain where name = $1`;

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

export type DbDomain = {
    readonly name: string,
    readonly description: string,
    readonly added_timestamp: Date,
    readonly removed_timestamp?: Date
}

export type DbCounter = {
    readonly id: number,
    readonly site_id: number,
    readonly domain_name: string,
    readonly site_domain: string,
    readonly name: string,
    readonly location: Geometry,
    readonly user_type_id: number,
    readonly interval: number,
    readonly direction: number,
    readonly added_timestamp: Date,
    readonly last_data_timestamp?: Date,
    readonly removed_timestamp?: Date
}

export function findAllDomains(db: IDatabase<any, any>): Promise<DbDomain[]> {
    return db.manyOrNone(PS_ALL_DOMAINS);
}

export function findAllCounters(db: IDatabase<any, any>): Promise<DbCounter[]> {
    return db.manyOrNone(PS_ALL_COUNTERS);
}

export function findAllCountersForDomain(db: IDatabase<any, any>, domain: string): Promise<DbCounter[]> {
    return db.manyOrNone(PS_ALL_COUNTERS_FOR_DOMAIN, [domain]);
}

export function insertCounters(db: IDatabase<any, any>, domain: string, counters: any[]): Promise<any> {
    return Promise.all(counters
        .map(c => db.none(PS_INSERT_COUNTER,
            [c.id, domain, c.domain, c.name, `POINT(${c.longitude} ${c.latitude})`, c.user_type, c.interval, c.sens]))
    );
}

export function removeCounters(db: IDatabase<any, any>, counters: any[]): Promise<any> {
    if(counters.length > 0) {
        return db.none(SQL_REMOVE_COUNTERS, [counters.map(c => c.id)]);
    }

    return Promise.resolve();
}

export function updateCounters(db: IDatabase<any, any>, counters: any[]): Promise<any> {
    return Promise.all(counters
        .map(c => db.none(PS_UPDATE_COUNTER, [c.domain, `POINT(${c.longitude} ${c.latitude})`,c.interval, c.sens, c.id]))
    );
}

export function findAllData(db: IDatabase<any, any>, siteId: number): Promise<any> {
    return db.none('select * from counting_site_data where site_id = $1', [siteId]);
}

export function getDomain(db: IDatabase<any, any>, domainName: string): Promise<DbDomain|null> {
    return db.oneOrNone(PS_FIND_DOMAIN, [domainName]);
}