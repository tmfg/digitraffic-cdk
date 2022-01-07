import {dbTestBase as commonDbTestBase} from "digitraffic-common/test/db-testutils";
import {DataType} from "digitraffic-common/db/last-updated";
import {TestHttpServer} from "digitraffic-common/test/httpserver";
import {DTDatabase} from "digitraffic-common/postgres/database";

export function dbTestBase(fn: (db: DTDatabase) => void) {
    return commonDbTestBase(
        fn, truncate, 'road', 'road', 'localhost:54322/road',
    );
}

function truncate(db: DTDatabase): Promise<void> {
    return db.tx(async t => {
        await t.none('DELETE FROM counting_site_data');
        await t.none('DELETE FROM counting_site_counter');
        await t.none('DELETE FROM counting_site_domain');
        await t.none('DELETE FROM data_updated');
    });
}

export function insertDomain(db: DTDatabase, domainName: string): Promise<null> {
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

export function insertCounter(db: DTDatabase, id: number, domainName: string, userType: number): Promise<null> {
    return db.tx(t => {
        return t.none(`
                insert into counting_site_counter(id, site_id, domain_name, name, site_domain, location, user_type_id, "interval", direction, added_timestamp)
                values(
                       $1, 1,
                       $2, 'name', 'DOMAIN', 'POINT(10 10)',
                       $3, 15, 1, current_date)                
            `, [id, domainName, userType]);
    });
}
export function insertLastUpdated(db: DTDatabase, id: number, updated: Date): Promise<null> {
    return db.tx(t => {
        return t.none(`
                insert into data_updated(id, data_type, updated)
                values($1, $2, $3)                
            `, [id, DataType.COUNTING_SITES_DATA, updated]);
    });
}

export async function withServer(port: number, url: string, response: string, fn: ((server: TestHttpServer) => void)): Promise<void> {
    const server = new TestHttpServer();

    const props = {
        [url]: () => response,
    };

    server.listen(port, props, false);

    try {
        await fn(server);
    } finally {
        server.close();
    }
}
