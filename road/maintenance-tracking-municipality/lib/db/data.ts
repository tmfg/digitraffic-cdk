import {PreparedStatement} from "pg-promise";
import {
    DbNumberId, DbTextId,
    DbMaintenanceTracking,
    DbDomainContract,
    DbDomainTaskMapping,
    DbWorkMachine,
} from "../model/data";
import {DTDatabase, DTTransaction} from "digitraffic-common/database/database";

const SRID = 4326; // WGS84



const SQL_UPSERT_MAINTENANCE_TRACKING_DOMAIN_CONTRACT =
    `INSERT INTO maintenance_tracking_domain_contract(domain, contract, name, start_date, end_date, data_last_updated)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT(domain, contract)
     DO
     UPDATE SET name = $3, start_date = $4, end_date = $5
     WHERE maintenance_tracking_domain_contract.name <> excluded.name
        OR maintenance_tracking_domain_contract.start_date <> excluded.start_date
        OR maintenance_tracking_domain_contract.end_date <> excluded.end_date
     RETURNING contract`;

const PS_UPSERT_MAINTENANCE_TRACKING_DOMAIN_CONTRACT = new PreparedStatement({
    name: 'UPSERT_MAINTENANCE_TRACKING_DOMAIN_CONTRACT',
    text: SQL_UPSERT_MAINTENANCE_TRACKING_DOMAIN_CONTRACT,
});

export function upsertContracts(db: DTDatabase, dbContracts: DbDomainContract[]) : Promise<DbTextId[]> {
    try {
        return db.tx(t => {
            return t.batch(dbContracts.map(contract => {
                return t.oneOrNone(PS_UPSERT_MAINTENANCE_TRACKING_DOMAIN_CONTRACT,
                    [contract.domain, contract.contract, contract.name, contract.start_date, contract.end_date, contract.data_last_updated]) as Promise<DbTextId>;
            }));
        });
    } catch (e) {
        console.error(`method=upsertContracts failed`, e);
        throw e;
    }
}



const SQL_UPDATE_MAINTENANCE_TRACKING_DOMAIN_CONTRACT_DATA_LAST_UPDATED =
    `UPDATE maintenance_tracking_domain_contract
     UPDATE SET data_last_updated = $3
     WHERE domain = $1
       AND contract = $2
       AND coalesce(data_last_updated, timestamp '1970-01-01T00:00:00Z') < $3`;

const PS_UPDATE_MAINTENANCE_TRACKING_DOMAIN_CONTRACT_DATA_LAST_UPDATED = new PreparedStatement({
    name: 'UPDATE_MAINTENANCE_TRACKING_DOMAIN_CONTRACT_DATA_LAST_UPDATED',
    text: SQL_UPDATE_MAINTENANCE_TRACKING_DOMAIN_CONTRACT_DATA_LAST_UPDATED,
});

export function updateContractLastUpdated(db: DTTransaction, domain: string, contract: string, lastUpdated : Date) : Promise<null> {
    try {
        return db.none(PS_UPDATE_MAINTENANCE_TRACKING_DOMAIN_CONTRACT_DATA_LAST_UPDATED,
            [domain, contract, lastUpdated]);
    } catch (e) {
        console.error(`method=updateContractLastUpdated failed`, e);
        throw e;
    }
}



const SQL_UPSERT_MAINTENANCE_TRACKING_DOMAIN_TASK_MAPPING =
    `INSERT INTO maintenance_tracking_domain_task_mapping (name, original_id, domain, ignore)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT(domain, original_id)
     DO NOTHING
     returning original_id`;

const PS_UPSERT_MAINTENANCE_TRACKING_DOMAIN_TASK_MAPPING = new PreparedStatement({
    name: 'UPSERT_MAINTENANCE_TRACKING_DOMAIN_TASK_MAPPING',
    text: SQL_UPSERT_MAINTENANCE_TRACKING_DOMAIN_TASK_MAPPING,
});

export function insertNewTasks(db: DTDatabase, dbTaskMapping: DbDomainTaskMapping[]) : Promise<DbTextId[]> {
    return db.tx(t => {
        return t.batch(dbTaskMapping.map(taskMapping => {
            return t.oneOrNone(PS_UPSERT_MAINTENANCE_TRACKING_DOMAIN_TASK_MAPPING,
                [taskMapping.name, taskMapping.original_id, taskMapping.domain, taskMapping.ignore]) as Promise<DbTextId>;
            // return a;
        }));
    });
}



const SQL_UPSERT_MAINTENANCE_TRACKING =
    `INSERT INTO maintenance_tracking(id, sending_system, sending_time, last_point, line_string, work_machine_id, start_time, end_time, direction, finished, domain, contract, message_original_id)
     VALUES (NEXTVAL('seq_maintenance_tracking'), $1, $2, ST_Force3D(ST_SetSRID(ST_GeomFromGeoJSON($3), ${SRID})), ST_Force3D(ST_SetSRID(ST_GeomFromGeoJSON($4), ${SRID})), $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING ID`;
// Might come in use in future
// ON CONFLICT(domain, message_original_id)
// WHERE (domain is not null) DO
// UPDATE SET sending_system = $1,
//            sending_time = $2,
//            last_point = ST_Force3D(ST_SetSRID(ST_GeomFromGeoJSON($3), ${SRID})),
//            line_string = ST_Force3D(ST_SetSRID(ST_GeomFromGeoJSON($4), ${SRID})),
//            work_machine_id = $5,
//            start_time = $6,
//            end_time = $7,
//            direction = $8,
//            finished = $9`;

const PS_UPSERT_MAINTENANCE_TRACKING = new PreparedStatement({
    name: 'UPSERT_MAINTENANCE_TRACKING',
    text: SQL_UPSERT_MAINTENANCE_TRACKING,
});



const SQL_INSERT_MAINTENANCE_TRACKING_TASK =
    `INSERT INTO maintenance_tracking_task(maintenance_tracking_id, task)
     VALUES ($1, $2)`;


const PS_INSERT_MAINTENANCE_TRACKING_TASK = new PreparedStatement({
    name: 'INSERT_MAINTENANCE_TRACKING_TASK',
    text: SQL_INSERT_MAINTENANCE_TRACKING_TASK,
});

export function upsertMaintenanceTracking(db: DTTransaction, data: DbMaintenanceTracking[]) {
    return Promise.all(data.map(async d => {

        console.info("method=upsertMaintenanceTracking INSERT: " + JSON.stringify(d));
        const mtId: DbNumberId = await db.one(PS_UPSERT_MAINTENANCE_TRACKING,
            [d.sendingSystem, d.sendingTime, d.lastPoint, d.lineString, d.workMachineId, d.startTime, d.endTime, d.direction, d.finished, d.domain, d.contract, d.municipalityMessageOriginalId])
            .catch((error) => {
                console.error('method=upsertMaintenanceTracking failed', error);
                throw error;
            });
        console.info(`method=upsertMaintenanceTracking id=${mtId.id} tasks: ${JSON.stringify(d.tasks)}`);

        await db.batch(d.tasks.map(task => {
            return db.none(PS_INSERT_MAINTENANCE_TRACKING_TASK, [mtId.id, task])
                .catch((error) => {
                    console.error(`method=upsertMaintenanceTracking insert task ${task} for tracking ${mtId.id} failed`, error);
                    throw error;
                });
        }));
    }));
}



const SQL_UPSERT_MAINTENANCE_TRACKING_WORK_MACHINE =
    `INSERT INTO maintenance_tracking_work_machine(id, harja_id, harja_urakka_id, type)
     VALUES (NEXTVAL('seq_maintenance_tracking_work_machine'), $1, $2, $3)
     ON CONFLICT(harja_id, harja_urakka_id) do 
     UPDATE SET type = $3
     RETURNING id`;

const PS_UPSERT_MAINTENANCE_TRACKING_WORK_MACHINE = new PreparedStatement({
    name: 'UPSERT_MAINTENANCE_TRACKING_WORK_MACHINE',
    text: SQL_UPSERT_MAINTENANCE_TRACKING_WORK_MACHINE,
});

export function upsertWorkMachine(db: DTTransaction, data: DbWorkMachine) : Promise<DbNumberId> {
    return db.one(PS_UPSERT_MAINTENANCE_TRACKING_WORK_MACHINE , [data.harjaId, data.harjaUrakkaId, data.type]);
}



const SQL_GET_MAINTENANCE_TRACKING_DOMAIN_CONTRACTS_WITH_SOURCE = `
    SELECT c.domain,
           c.contract,
           c.name,
           c.source,
           c.start_date, 
           c.end_date, 
           c.data_last_updated
    FROM maintenance_tracking_domain_contract c 
    WHERE c.domain = $1
      AND source is not null`;

const PS_GET_CONTRACTS_WITH_SOURCE = new PreparedStatement({
    name: 'GET_MAINTENANCE_T_MUNICIPALITY_DOMAIN_CONTRACTS_WITH_SOURCE',
    text: SQL_GET_MAINTENANCE_TRACKING_DOMAIN_CONTRACTS_WITH_SOURCE,
});

export function getContractsWithSource(domainName: string, db: DTDatabase): Promise<DbDomainContract[]> {
    return db.manyOrNone(PS_GET_CONTRACTS_WITH_SOURCE, [domainName]);
}

const SQL_GET_MAINTENANCE_TRACKING_DOMAIN_TASK_MAPPINGS = `
    SELECT c.name,
           c.original_id,
           c.ignore,
           c.domain 
    FROM maintenance_tracking_domain_task_mapping c 
    WHERE c.domain = $1`;

const PS_GET_TASK_MAPPINGS = new PreparedStatement({
    name: 'GET_MAINTENANCE_TRACKING_DOMAIN_TASK_MAPPINGS',
    text: SQL_GET_MAINTENANCE_TRACKING_DOMAIN_TASK_MAPPINGS,
});

export function getTaskMappings(domainName: string, db: DTDatabase): Promise<DbDomainTaskMapping[]> {
    return db.manyOrNone(PS_GET_TASK_MAPPINGS, [domainName]);
}

