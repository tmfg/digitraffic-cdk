import {IDatabase} from "pg-promise";
import {dbTestBase as commonDbTestBase} from "digitraffic-common/test/db-testutils";
import {DataType} from "digitraffic-common/db/last-updated";

export function dbTestBase(fn: (db: IDatabase<any, any>) => any) {
    return commonDbTestBase(fn, truncate, 'road', 'road', 'localhost:54322/road');
}

async function truncate(db: IDatabase<any, any>): Promise<any> {
    return await db.tx(async t => {
        await t.none('DELETE FROM counting_site_data');
        await t.none('DELETE FROM counting_site_counter');
        await t.none('DELETE FROM counting_site_domain');
        await t.none('DELETE FROM data_updated');
    });
}

export function insertDomain(db: IDatabase<any, any>, domainName: string) {
    return db.tx(t => {
            return t.none(`
                insert into counting_site_domain("name", description, added_timestamp)
                values(
                       $1,
                       'description',
                       current_date)                
            `, [domainName]);
    });
}

export function insertCounter(db: IDatabase<any, any>, id: number, domainName: string, userType: number) {
    return db.tx(t => {
        return t.none(`
                insert into counting_site_counter(id, site_id, domain_name, site_domain, location, user_type_id, "interval", direction, added_timestamp)
                values(
                       $1, 1,
                       $2, 'DOMAIN', 'POINT(10 10)',
                       $3, 15, 1, current_date)                
            `, [id, domainName, userType]);
    });
}
export function insertLastUpdated(db: IDatabase<any, any>, id: number, updated: Date) {
    return db.tx(t => {
        return t.none(`
                insert into data_updated(id, data_type, updated)
                values($1, $2, $3)                
            `, [id, DataType.COUNTING_SITES, updated]);
    });
}
