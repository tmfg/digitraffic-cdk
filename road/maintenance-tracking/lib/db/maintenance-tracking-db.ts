import {IDatabase} from "pg-promise";
import * as R from 'ramda';

export enum Status {
    UNHANDLED = 'UNHANDLED',
    HANDLED = 'HANDLED',
    ERROR = 'ERROR'
}

export interface DbObservationData {
    readonly id?: bigint,
    readonly observationTime: Date,
    readonly sendingTime: Date,
    readonly json: string,
    readonly harjaWorkmachineId: number,
    readonly harjaContractId: number,
    readonly sendingSystem: string,
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
        sending_system,
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
        $(sendingSystem),
        $(status),
        $(hash),
        $(s3Uri))
    ON CONFLICT(hash)  DO NOTHING
    RETURNING id
`;

export function insertMaintenanceTrackingObservationData(db: IDatabase<any, any>, observations: DbObservationData[]): Promise<any> {
    return db.tx(t => {
        return t.batch(
            observations.map(observation =>
                db.oneOrNone(UPSERT_MAINTENANCE_TRACKING_OBSERVATION_DATA_SQL, observation)
            )
        )
    });
}

export function createInsertObservationValues(e: DbObservationData): any[] {
    return [
        e.observationTime,
        e.sendingTime,
        e.json,
        e.harjaWorkmachineId,
        e.harjaContractId,
        e.sendingSystem,
        e.status,
        e.hash,
        e.s3Uri
    ];
}

export function cloneObservationsWithoutJson(datas: DbObservationData[]) : DbObservationData[] {
    return R.map(R.assoc('json', '{...REMOVED...}'), datas);
}