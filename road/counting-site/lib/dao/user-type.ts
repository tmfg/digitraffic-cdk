import { PreparedStatement } from "pg-promise";
import { ResultUserTypes } from "../model/usertype";
import { DTDatabase } from "@digitraffic/common/dist/database/database";
import { EPOCH } from "@digitraffic/common/dist/utils/date-utils";

const SQL_ALL_USER_TYPES = "select id, name, modified from counting_site_user_type";

const PS_ALL_USER_TYPES = new PreparedStatement({
    name: "find-all-user-types",
    text: SQL_ALL_USER_TYPES
});

interface DbUserType {
    readonly id: string;
    readonly name: string;
    readonly modified: Date;
}

export function findAllUserTypes(db: DTDatabase): Promise<[ResultUserTypes, Date]> {
    return db.manyOrNone<DbUserType>(PS_ALL_USER_TYPES).then((results) => {
        const lastModified = results.map((r) => r.modified).reduce((a, b) => (a > b ? a : b), EPOCH);
        return [Object.fromEntries(results.map((r) => [r.id, r.name])), lastModified];
    });
}
