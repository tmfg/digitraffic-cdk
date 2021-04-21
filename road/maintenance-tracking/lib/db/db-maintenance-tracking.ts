import {IDatabase, PreparedStatement} from "pg-promise";


export interface DbMaintenanceTrackingData {
    readonly id?: bigint,
    readonly json: string,
    readonly status: Status,
    readonly hash: string,
    readonly sendingTime: Date
}

export enum Status {
    UNHANDLED = 'UNHANDLED',
    HANDLED = 'HANDLED',
    ERROR = 'ERROR'
}

const INSERT_MAINTENANCE_TRACKING_DATA_SQL = `
    INSERT INTO maintenance_tracking_data(id, json, status, hash, sending_time)
    VALUES(NEXTVAL('SEQ_MAINTENANCE_TRACKING_DATA'), $1, $2, $3, $4)
`;

/**
 * On conflict database error is thrown if message with same hash already exists.
 */
export async function insertMaintenanceTrackingData(db: IDatabase<any, any>, tracking: DbMaintenanceTrackingData): Promise<any> {
    const ps = new PreparedStatement({
        name: 'insert-maintenance-tracking-data',
        text: INSERT_MAINTENANCE_TRACKING_DATA_SQL,
    });
    return await db.oneOrNone(ps, createInsertMessageValues(tracking));
}

export function createInsertMessageValues(e: DbMaintenanceTrackingData): any[] {
    return [
        e.json,
        e.status,
        e.hash,
        e.sendingTime
    ];
}


export interface DbObservationData {
    readonly id?: bigint,
    readonly observationTime: Date,
    readonly sendingTime: Date,
    readonly json: string,
    readonly harjaWorkmachineId: number,
    readonly harjaContractId: number,
    readonly status: Status,
    readonly hash: string,
    readonly s3Uri: string;
}

const UPSERT_MAINTENANCE_TRACKING_OBSERVATION_DATA_SQL = `
    INSERT INTO MAINTENANCE_TRACKING_OBSERVATION_DATA(
        id, 
        observation_time,
        sending_time,
        json,
        harja_workmachine_id,
        harja_contract_id,
        status,
        hash,
        s3_uri)
    VALUES(
        NEXTVAL('SEQ_MAINTENANCE_TRACKING_OBSERVATION_DATA'),
        $(observationTime),
        $(sendingTime),
        $(json),
        $(harjaWorkmachineId),
        $(harjaContractId),
        $(status),
        $(hash),
        $(s3Uri))
    ON CONFLICT(hash) DO NOTHING
`;

export function insertMaintenanceTrackingObservationData(db: IDatabase<any, any>, observations: DbObservationData[]): Promise<any>[] {
    return observations.map(observation => {
        return db.none(UPSERT_MAINTENANCE_TRACKING_OBSERVATION_DATA_SQL,
                       observation);
    });
}

export function createInsertObservationValues(e: DbObservationData): any[] {
    return [
        e.observationTime,
        e.sendingTime,
        e.json,
        e.harjaWorkmachineId,
        e.harjaContractId,
        e.status,
        e.hash,
        e.hash
    ];
}