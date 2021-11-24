import {PreparedStatement} from "pg-promise";
import {DbDomain} from "../model/domain";
import {DbUserType} from "../model/usertype";
import {DTDatabase} from "digitraffic-common/postgres/database";

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

export function findAllUserTypes(db: DTDatabase): Promise<DbUserType[]> {
    return db.manyOrNone(PS_ALL_USER_TYPES).then(results => Object.fromEntries(results.map(r => [r.id, r.name])));
}

export function findAllDomains(db: DTDatabase): Promise<DbDomain[]> {
    return db.manyOrNone(PS_ALL_DOMAINS);
}
