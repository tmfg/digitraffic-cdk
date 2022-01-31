import {PreparedStatement} from "pg-promise";
import {ResultUserTypes} from "../model/usertype";
import {DTDatabase} from "digitraffic-common/database/database";

const SQL_ALL_USER_TYPES = "select id, name from counting_site_user_type";

const PS_ALL_USER_TYPES = new PreparedStatement({
    name: 'find-all-user-types',
    text: SQL_ALL_USER_TYPES,
});

export function findAllUserTypes(db: DTDatabase): Promise<ResultUserTypes> {
    return db.manyOrNone(PS_ALL_USER_TYPES).then(results => Object.fromEntries(results.map(r => [r.id, r.name])));
}
