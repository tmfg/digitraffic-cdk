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
    return await db.oneOrNone(ps, createUpdateValues(tracking));
}

export function createUpdateValues(e: DbMaintenanceTrackingData): any[] {
    return [
        e.json,
        e.status,
        e.hash,
        e.sendingTime
    ];
}