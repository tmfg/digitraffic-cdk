import {IDatabase, PreparedStatement} from "pg-promise";


export interface DbMaintenanceTrackingData {
    readonly json: string,
    readonly status: Status,
    readonly hash: string
}

export enum Status {
    UNHANDLED = 'UNHANDLED',
    HANDLED = 'HANDLED',
    ERROR = 'ERROR'
}

/*
CREATE SEQUENCE SEQ_MAINTENANCE_TRACKING_DATA;

CREATE TABLE IF NOT EXISTS MAINTENANCE_TRACKING_DATA
(
    id              BIGINT NOT NULL PRIMARY KEY,
    json            TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL,
    handling_info   TEXT,
    created         TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modified        TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT NOW()
);
 */

const INSERT_MAINTENANCE_TRACKING_DATA_SQL = `
    INSERT INTO maintenance_tracking_data(id, json, status, hash)
    VALUES(NEXTVAL('SEQ_MAINTENANCE_TRACKING_DATA'), $1, $2, $3)
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
        e.hash
    ];
}