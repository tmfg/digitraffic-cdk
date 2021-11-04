import {IDatabase, PreparedStatement} from "pg-promise";
import {DbCounter} from "../model/counter";
import {DbDomain} from "../model/domain";

const SQL_ALL_USER_TYPES = "select id, name from counting_site_user_type";

const SQL_ALL_DOMAINS =
    `select name, description, added_timestamp, removed_timestamp
    from counting_site_domain order by name`;

const PS_ALL_USER_TYPES = new PreparedStatement({
    name: 'find-all-user-types',
    text: SQL_ALL_USER_TYPES
})

const PS_ALL_DOMAINS = new PreparedStatement({
    name: 'select-domains',
    text: SQL_ALL_DOMAINS,
});

export function findAllUserTypes(db: IDatabase<any, any>): Promise<DbCounter[]> {
    return db.manyOrNone(PS_ALL_USER_TYPES);
}

export function findAllDomains(db: IDatabase<any, any>): Promise<DbDomain[]> {
    return db.manyOrNone(PS_ALL_DOMAINS);
}
