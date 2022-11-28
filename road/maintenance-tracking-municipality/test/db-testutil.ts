import { dbTestBase as commonDbTestBase } from "@digitraffic/common/dist/test/db-testutils";
import { DTDatabase } from "@digitraffic/common/dist/database/database";
import {
    DbDomain,
    DbDomainContract,
    DbMaintenanceTracking,
} from "../lib/model/db-data";

export function dbTestBase(fn: (db: DTDatabase) => void) {
    return commonDbTestBase(
        fn,
        truncate,
        "road",
        "road",
        "localhost:54322/road"
    );
}

export function dbTestBaseNoTruncate(fn: (db: DTDatabase) => void) {
    return commonDbTestBase(
        fn,
        () => Promise.resolve(),
        "road",
        "road",
        "localhost:54322/road"
    );
}

export function truncate(db: DTDatabase): Promise<void> {
    return db.tx(async (t) => {
        await t.none("TRUNCATE maintenance_tracking CASCADE");
        await t.none("TRUNCATE maintenance_tracking_work_machine CASCADE");
        await t.none(
            "TRUNCATE maintenance_tracking_domain_task_mapping CASCADE"
        );
        await t.none("TRUNCATE maintenance_tracking_domain_contract CASCADE");
        await t.none("TRUNCATE maintenance_tracking_domain CASCADE");
        await t.none("TRUNCATE data_updated");
    });
}

export function insertDomain(
    db: DTDatabase,
    domainName: string,
    source?: string
): Promise<null> {
    return db.tx((t) => {
        return t.none(
            `
                insert into maintenance_tracking_domain(name, source)
                values($1,$2)`,
            [domainName, source]
        );
    });
}

export function insertDomaindTaskMapping(
    db: DTDatabase,
    name: string,
    originalId: string,
    domainName: string,
    ignore: boolean
): Promise<null> {
    return db.tx((t) => {
        return t.none(
            `
                insert into maintenance_tracking_domain_task_mapping(name, original_id, domain, ignore)
                VALUES ($1, $2, $3, $4)`,
            [name, originalId, domainName, ignore]
        );
    });
}

export function insertDbDomaindContract(
    db: DTDatabase,
    contract: DbDomainContract
) {
    return insertDomaindContract(
        db,
        contract.domain,
        contract.contract,
        contract.name,
        contract.source,
        contract.start_date,
        contract.end_date
    );
}

export function insertDomaindContract(
    db: DTDatabase,
    domainName: string,
    contract: string,
    name: string,
    source?: string,
    startDate?: Date,
    endDate?: Date,
    dataLastUpdated?: Date
): Promise<null> {
    return db.tx((t) => {
        return t.none(
            `
                INSERT INTO maintenance_tracking_domain_contract(domain, contract, name, start_date, end_date, data_last_updated, source)
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                domainName,
                contract,
                name,
                startDate,
                endDate,
                dataLastUpdated,
                source,
            ]
        );
    });
}

export function findAllDomaindContracts(
    db: DTDatabase,
    domainName: string
): Promise<DbDomainContract[]> {
    return db.tx((t) => {
        return t.manyOrNone(
            `
                select domain, contract, name, start_date, end_date, data_last_updated, source
                from maintenance_tracking_domain_contract contract
                where contract.domain = $1`,
            [domainName]
        );
    });
}

export function getDomain(
    db: DTDatabase,
    domainName: string
): Promise<DbDomain> {
    return db.tx((t) => {
        return t.one(
            `
                select name, source, created, modified
                from maintenance_tracking_domain domain
                where domain.name = $1`,
            [domainName]
        );
    });
}

export function getDomaindContract(
    db: DTDatabase,
    domainName: string,
    contractId: string
): Promise<DbDomainContract> {
    return db.tx((t) => {
        return t.one(
            `
                select domain, contract, name, start_date, end_date, data_last_updated, source
                from maintenance_tracking_domain_contract contract
                where contract.domain = $1 AND contract.contract = $2`,
            [domainName, contractId]
        );
    });
}

export function findAllTrackings(
    db: DTDatabase,
    domainName: string
): Promise<DbMaintenanceTracking[]> {
    return db.tx((t) => {
        return t
            .manyOrNone(
                `
                select id, previous_tracking_id, sending_system, sending_time, 
                       ST_AsGeoJSON(last_point::geometry)::json as last_point, ST_AsGeoJSON(line_string::geometry)::json as line_string, 
                       work_machine_id, start_time, end_time, direction, finished, domain, contract, message_original_id,
                       ARRAY_AGG(task.task) AS tasks
                from maintenance_tracking tracking
                inner join maintenance_tracking_task task on tracking.id = task.maintenance_tracking_id
                where tracking.domain = $1
                group by tracking.id, tracking.end_time
                order by tracking.end_time`,
                [domainName]
            )
            .then((value) => {
                return value;
            });
    });
}
