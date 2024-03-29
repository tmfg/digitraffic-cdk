import { default as pgPromise } from "pg-promise";
import type { DbDomain } from "../model/domain.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";

const SQL_ALL_DOMAINS = `select name, description, created, removed_timestamp, modified
    from counting_site_domain order by name`;

const PS_ALL_DOMAINS = new pgPromise.PreparedStatement({
    name: "select-domains",
    text: SQL_ALL_DOMAINS
});

export function findAllDomains(db: DTDatabase): Promise<DbDomain[]> {
    return db.manyOrNone(PS_ALL_DOMAINS);
}
