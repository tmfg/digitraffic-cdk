import {PreparedStatement} from "pg-promise";
import {DTDatabase, DTTransaction} from "digitraffic-common/database/database";
import {SRID_WGS84} from "digitraffic-common/utils/geometry";

import {DbDomainContract, DbDomainTaskMapping, DbLatestTracking, DbMaintenanceTracking, DbNumberId, DbTextId, DbWorkMachine} from "../model/db-data";
import {Position} from "geojson";


const PS_UPSERT_MAINTENANCE_TRACKING_DOMAIN = new PreparedStatement({
    name: 'PS_UPSERT_MAINTENANCE_TRACKING_DOMAIN',
    text: `INSERT INTO maintenance_tracking_domain(name, source)
           VALUES ($1, $2)
           ON CONFLICT (name) DO NOTHING;`,
});

export function upsertDomain(db: DTDatabase, domain: string, source?: string) : Promise<null> {
    try {
        return db.tx(t => {
            return t.none(PS_UPSERT_MAINTENANCE_TRACKING_DOMAIN, [domain, source]);
        });
    } catch (e) {
        console.error(`method=upsertContracts failed`, e);
        throw e;
    }
}

const PS_UPSERT_MAINTENANCE_TRACKING_DOMAIN_CONTRACT = new PreparedStatement({
    name: 'UPSERT_MAINTENANCE_TRACKING_DOMAIN_CONTRACT',
    text: `INSERT INTO maintenance_tracking_domain_contract(domain, contract, name, start_date, end_date, data_last_updated)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT(domain, contract)
           DO
           UPDATE SET name = $3, start_date = $4, end_date = $5
           WHERE maintenance_tracking_domain_contract.name <> excluded.name
              OR maintenance_tracking_domain_contract.start_date <> excluded.start_date
              OR maintenance_tracking_domain_contract.end_date <> excluded.end_date
           RETURNING contract`,
});

export function upsertContract(db: DTDatabase, dbContract: DbDomainContract) : Promise<DbTextId|null> {
    return upsertContracts(db, [dbContract]).then((value) => {
        if (value && value.length > 0) {
            return value[0];
        }
        return null;
    });
}

export function upsertContracts(db: DTDatabase, dbContracts: DbDomainContract[]) : Promise<DbTextId[]> {
    try {
        return db.tx(t => {
            const upsertContractFn = (contract: DbDomainContract) => {
                return t.oneOrNone(PS_UPSERT_MAINTENANCE_TRACKING_DOMAIN_CONTRACT,
                    [contract.domain, contract.contract, contract.name, contract.start_date, contract.end_date, contract.data_last_updated]) as Promise<DbTextId>;
            };
            return t.batch(dbContracts.map(upsertContractFn));
        });
    } catch (e) {
        console.error(`method=upsertContracts failed`, e);
        throw e;
    }
}



const PS_UPDATE_MAINTENANCE_TRACKING_DOMAIN_CONTRACT_DATA_LAST_UPDATED = new PreparedStatement({
    name: 'UPDATE_MAINTENANCE_TRACKING_DOMAIN_CONTRACT_DATA_LAST_UPDATED',
    text: `UPDATE maintenance_tracking_domain_contract
           UPDATE SET data_last_updated = $3
           WHERE domain = $1
             AND contract = $2
             AND coalesce(data_last_updated, timestamp '1970-01-01T00:00:00Z') < $3`,
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



const PS_UPSERT_MAINTENANCE_TRACKING_DOMAIN_TASK_MAPPING = new PreparedStatement({
    name: 'UPSERT_MAINTENANCE_TRACKING_DOMAIN_TASK_MAPPING',
    text: `INSERT INTO maintenance_tracking_domain_task_mapping (name, original_id, domain, ignore, info)
           VALUES ($1, $2, $3, $4, 'TODO: Auto generated')
           ON CONFLICT(domain, original_id)
           DO NOTHING
           RETURNING original_id`,
});

export function upsertTaskMappings(db: DTDatabase, dbTaskMapping: DbDomainTaskMapping[]) : Promise<DbTextId[]> {
    return db.tx(t => {
        const upsertTaskMapping = (taskMapping: DbDomainTaskMapping) => {
            return t.oneOrNone(PS_UPSERT_MAINTENANCE_TRACKING_DOMAIN_TASK_MAPPING,
                [taskMapping.name, taskMapping.original_id, taskMapping.domain, taskMapping.ignore]) as Promise<DbTextId>;
        };
        return t.batch(dbTaskMapping.map(upsertTaskMapping));
    });
}

const PS_UPDATE_MAINTENANCE_TRACKING_END_POINT_AND_MARK_FINISHED = new PreparedStatement({
    name: 'PS_UPDATE_MAINTENANCE_TRACKING_END_POINT_AND_MARK_FINISHED',
    text: `UPDATE maintenance_tracking 
           SET finished = true,
               end_time = $2,
               last_point = ST_Force3D(ST_SetSRID($3::geometry, ${SRID_WGS84})),
               line_string = ST_MakeLine(coalesce(line_string, last_point), ST_Force3D(ST_SetSRID($3::geometry, ${SRID_WGS84}))),
               direction = $4
           WHERE finished = false
             AND id = $1`,
});

export function appendMaintenanceTrackingEndPointAndMarkFinished(
    db: DTDatabase | DTTransaction, id: number, endPosition: Position, endTime: Date, direction?: number,
) {
    return db.none(PS_UPDATE_MAINTENANCE_TRACKING_END_POINT_AND_MARK_FINISHED,
        [id, endTime, `POINT(${endPosition[0]} ${endPosition[1]})`, direction]);
}


const PS_MARK_MAINTENANCE_TRACKING_FINISHED = new PreparedStatement({
    name: 'PS_MARK_MAINTENANCE_TRACKING_FINISHED',
    text: `UPDATE maintenance_tracking 
           SET finished = true
           WHERE finished = false
             AND id = $1`,
});
export function markMaintenanceTrackingFinished(db: DTDatabase | DTTransaction, id: number) {
    return db.none(PS_MARK_MAINTENANCE_TRACKING_FINISHED,
        [id]);
}


const PS_INSERT_MAINTENANCE_TRACKING = new PreparedStatement({
    name: 'PS_INSERT_MAINTENANCE_TRACKING',
    text: `INSERT INTO maintenance_tracking(
               id, sending_system, sending_time, 
               last_point,
               line_string,
               work_machine_id, start_time, end_time, direction, finished, domain, contract, message_original_id, previous_tracking_id)
           VALUES (
               NEXTVAL('seq_maintenance_tracking'), $1, $2, 
               ST_Force3D(ST_SetSRID(ST_GeomFromGeoJSON($3), ${SRID_WGS84})), 
               ST_Simplify(ST_Force3D(ST_SetSRID(ST_GeomFromGeoJSON($4), ${SRID_WGS84})), 0.00005, true), 
               $5, $6, $7, $8, $9, $10, $11, $12, $13)
           RETURNING ID`,
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
//            finished = $9`
});


const PS_INSERT_MAINTENANCE_TRACKING_TASK = new PreparedStatement({
    name: 'PS_INSERT_MAINTENANCE_TRACKING_TASK',
    text: `INSERT INTO maintenance_tracking_task(maintenance_tracking_id, task)
           VALUES ($1, $2)`,
});


export function upsertMaintenanceTrackings(db: DTTransaction, data: DbMaintenanceTracking[]): Promise<DbNumberId[]> {
    return Promise.all(data.map((tracking) => insertMaintenanceTracking(db, tracking)));
}

export async function insertMaintenanceTracking(tx: DTTransaction, tracking: DbMaintenanceTracking): Promise<DbNumberId> {

    const lineString = tracking.line_string ? JSON.stringify(tracking.line_string) : null;
    const mtId: DbNumberId = await tx.one(PS_INSERT_MAINTENANCE_TRACKING,
        [tracking.sending_system, tracking.sending_time, JSON.stringify(tracking.last_point), lineString,
            tracking.work_machine_id, tracking.start_time, tracking.end_time, tracking.direction, tracking.finished,
            tracking.domain, tracking.contract, tracking.message_original_id, tracking.previous_tracking_id])
        .catch((error) => {
            console.error('method=upsertMaintenanceTracking failed', error);
            throw error;
        });
    if (tracking.previous_tracking_id) {
        await updateMaintenanceTrackingFinished(tx, tracking.previous_tracking_id);
    }

    const insertHarjaTask = (harjaTask: string) => {
        return tx.none(PS_INSERT_MAINTENANCE_TRACKING_TASK, [mtId.id, harjaTask])
            .catch((error) => {
                console.error(`method=upsertMaintenanceTracking insert task ${harjaTask} for tracking ${mtId.id} failed`, error);
                throw error;
            });
    };
    return tx.batch(tracking.tasks.map(insertHarjaTask)).then(() => mtId);
}

const PS_UPDATE_MAINTENANCE_TRACKING_FINISHED = new PreparedStatement({
    name: 'PS_UPDATE_MAINTENANCE_TRACKING_FINISHED',
    text: `UPDATE maintenance_tracking 
           SET finished = true
           WHERE finished = false
             AND id = $1`,
});

export function updateMaintenanceTrackingFinished(db: DTDatabase | DTTransaction, id: number): Promise<null> {
    return db.none(PS_UPDATE_MAINTENANCE_TRACKING_FINISHED, [id]);
}


const PS_UPSERT_MAINTENANCE_TRACKING_WORK_MACHINE = new PreparedStatement({
    name: 'PS_UPSERT_MAINTENANCE_TRACKING_WORK_MACHINE',
    text: `INSERT INTO maintenance_tracking_work_machine(id, harja_id, harja_urakka_id, type)
           VALUES (NEXTVAL('seq_maintenance_tracking_work_machine'), $1, $2, $3)
           ON CONFLICT(harja_id, harja_urakka_id) do 
           UPDATE SET type = $3
           RETURNING id`,
});

export function upsertWorkMachine(db: DTTransaction, data: DbWorkMachine) : Promise<DbNumberId> {
    return db.one(PS_UPSERT_MAINTENANCE_TRACKING_WORK_MACHINE , [data.harjaId, data.harjaUrakkaId, data.type]);
}


const PS_FIND_LATEST_NOT_FINISHED_TRACKING_FOR_WORK_MACHINE_WITHOUT_NEXT_TRACKING = new PreparedStatement({
    name: 'PS_FIND_LATEST_NOT_FINISHED_TRACKING_FOR_MACHINE_WITHOUT_NEXT',
    text: `
    select t.id
         , ST_AsGeoJSON(t.last_point) as last_point
         , t.end_time
         , t.work_machine_id
         , t.finished
         , array_agg(task.task order by task.task, 1) as tasks
    from maintenance_tracking t
    inner join maintenance_tracking_task task on t.id = task.maintenance_tracking_id
    where finished = false
      and domain = $1::text
      and work_machine_id = $2::bigint
      and not exists(
          select null
          from maintenance_tracking other
          where other.previous_tracking_id = t.id
      )
    group by t.id, t.end_time
    order by t.end_time desc
    limit 1`,
});

export function findLatestNotFinishedTrackingForWorkMachine(db: DTDatabase, domainName: string, workMachineId: number) : Promise<DbLatestTracking | null> {
    return db.oneOrNone(PS_FIND_LATEST_NOT_FINISHED_TRACKING_FOR_WORK_MACHINE_WITHOUT_NEXT_TRACKING,
        [domainName, workMachineId]);
}


const PS_GET_CONTRACTS_WITH_SOURCE = new PreparedStatement({
    name: 'PS_GET_MAINTENANCE_T_MUNICIPALITY_DOMAIN_CONTRACTS_WITH_SOURCE',
    text: `
    SELECT c.domain,
           c.contract,
           c.name,
           c.source,
           c.start_date, 
           c.end_date, 
           c.data_last_updated
    FROM maintenance_tracking_domain_contract c 
    WHERE c.domain = $1
      AND source is not null`,
});

export function getContractsWithSource(db: DTDatabase, domainName: string): Promise<DbDomainContract[]> {
    return db.manyOrNone(PS_GET_CONTRACTS_WITH_SOURCE, [domainName]);
}

export function getContractWithSource(db: DTDatabase, domainName: string): Promise<DbDomainContract|null> {
    return db.oneOrNone(PS_GET_CONTRACTS_WITH_SOURCE, [domainName]);
}


const PS_GET_TASK_MAPPINGS = new PreparedStatement({
    name: 'PS_GET_MAINTENANCE_TRACKING_DOMAIN_TASK_MAPPINGS',
    text: `SELECT c.name,
                  c.original_id,
                  c.ignore,
                  c.domain 
           FROM maintenance_tracking_domain_task_mapping c 
           WHERE c.domain = $1`,
});

export function getTaskMappings(db: DTDatabase, domainName: string): Promise<DbDomainTaskMapping[]> {
    return db.manyOrNone(PS_GET_TASK_MAPPINGS, [domainName]);
}

