import {dbTestBase as commonDbTestBase} from "digitraffic-common/test/db-testutils";
import {DataType} from "digitraffic-common/database/last-updated";
import {TestHttpServer} from "digitraffic-common/test/httpserver";
import {DTDatabase} from "digitraffic-common/database/database";
import {lambda_layer_awscli} from "aws-cdk-lib";
import {DbDomainContract, DbMaintenanceTracking} from "../lib/model/data";
import {SRID_WGS84} from "digitraffic-common/utils/geometry";

export function dbTestBase(fn: (db: DTDatabase) => void) {
    return commonDbTestBase(
        fn, truncate, 'road', 'road', 'localhost:54322/road',
    );
}

export function truncate(db: DTDatabase): Promise<void> {
    return db.tx(async t => {
        await t.none('DELETE FROM maintenance_tracking');
        await t.none('DELETE FROM maintenance_tracking_domain_task_mapping');
        await t.none('DELETE FROM maintenance_tracking_domain_contract');
        await t.none('DELETE FROM maintenance_tracking_domain');
        await t.none('DELETE FROM maintenance_tracking');
        await t.none('DELETE FROM data_updated');
    });
}

export function insertDomain(db: DTDatabase, domainName: string, source : string): Promise<null> {
    return db.tx(t => {
        return t.none(`
                insert into maintenance_tracking_domain(name, source)
                values($1,$2)`,
        [domainName, source]);
    });
}

export function insertDomaindTaskMapping(
    db: DTDatabase, name : string, originalId : string,
    domainName: string, ignore : boolean,
): Promise<null> {
    return db.tx(t => {
        return t.none(`
                insert into maintenance_tracking_domain_task_mapping(name, original_id, domain, ignore)
                VALUES ($1, $2, $3, $4)`,
        [name, originalId, domainName, ignore]);
    });
}

export function insertDomaindContract(
    db: DTDatabase, domainName: string, contract: string, name: string, startDate: Date | undefined, endDate: Date | undefined,
    dataLastUpdated: undefined, source : string,
): Promise<null> {
    return db.tx(t => {
        return t.none(`
                INSERT INTO maintenance_tracking_domain_contract(domain, contract, name, start_date, end_date, data_last_updated, source)
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [domainName, contract, name, startDate, endDate, dataLastUpdated, source]);
    });
}

export function findAllDomaindContracts(db: DTDatabase, domainName: string): Promise<DbDomainContract[]> {
    return db.tx(t => {
        return t.manyOrNone(`
                select domain, contract, name, start_date, end_date, data_last_updated, source
                from maintenance_tracking_domain_contract contract
                where contract.domain = $1`,
        [domainName]);
    });
}

export function getDomaindContract(db: DTDatabase, domainName: string, contractId : string): Promise<DbDomainContract> {
    return db.tx(t => {
        return t.one(`
                select domain, contract, name, start_date, end_date, data_last_updated, source
                from maintenance_tracking_domain_contract contract
                where contract.domain = $1 AND contract.contract = $2`,
        [domainName, contractId]);
    });
}

export function findAllTrackings(db: DTDatabase, domainName: string): Promise<DbMaintenanceTracking[]>  {
    return db.tx(t => {
        return t.manyOrNone(`
                select id, sending_system, sending_time, last_point, line_string, work_machine_id, start_time, end_time, direction, finished, domain, contract, message_original_id,
                       ARRAY_AGG(task.task) AS tasks
                from maintenance_tracking tracking
                inner join maintenance_tracking_task task on tracking.id = task.maintenance_tracking_id
                where tracking.domain = $1
                group by tracking.id`,
        [domainName]);
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
