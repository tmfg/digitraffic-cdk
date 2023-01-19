import { DTDatabase } from "@digitraffic/common/dist/database/database";
import { PreparedStatement } from "pg-promise";
import * as R from "ramda";
import { DbNumberId } from "../model/db-data";

export enum Status {
    UNHANDLED = "UNHANDLED",
    HANDLED = "HANDLED",
    ERROR = "ERROR",
}

export interface DbObservationData {
    readonly id?: bigint;
    readonly observationTime: Date;
    readonly sendingTime: Date;
    readonly json: string;
    readonly harjaWorkmachineId: number;
    readonly harjaContractId: number;
    readonly sendingSystem: string;
    readonly status: Status;
    readonly hash: string;
    readonly s3Uri: string;
}

const UPSERT_MAINTENANCE_TRACKING_OBSERVATION_DATA_SQL = `
    INSERT INTO MAINTENANCE_TRACKING_OBSERVATION_DATA(id,
                                                      observation_time,
                                                      sending_time,
                                                      json,
                                                      harja_workmachine_id,
                                                      harja_contract_id,
                                                      sending_system,
                                                      status,
                                                      hash,
                                                      s3_uri)
    VALUES (NEXTVAL('SEQ_MAINTENANCE_TRACKING_OBSERVATION_DATA'),
            $(observationTime),
            $(sendingTime),
            $(json),
            $(harjaWorkmachineId),
            $(harjaContractId),
            $(sendingSystem),
            $(status),
            $(hash),
            $(s3Uri))
    ON CONFLICT(hash) DO NOTHING
    RETURNING id
`;

export function insertMaintenanceTrackingObservationData(
    db: DTDatabase,
    observations: DbObservationData[]
): Promise<(DbNumberId | null)[]> {
    return db.tx((t) => {
        return t.batch(
            observations.map((observation) =>
                db.oneOrNone(
                    UPSERT_MAINTENANCE_TRACKING_OBSERVATION_DATA_SQL,
                    observation
                )
            )
        );
    });
}

const PS_CLEAR_PREVIOUS_MAINTENANCE_TRACKING_ID_OLDER_THAN_HOURS =
    new PreparedStatement({
        name: "PS_CLEAR_PREVIOUS_MAINTENANCE_TRACKING_ID_OLDER_THAN_HOURS",
        text: `
        UPDATE maintenance_tracking
        SET previous_tracking_id = NULL
        WHERE end_time < (now() - $1 * INTERVAL '1 hour')
`,
    });

const PS_DELETE_MAINTENANCE_TRACKINGS_OLDER_THAN_HOURS = new PreparedStatement({
    name: "PS_DELETE_MAINTENANCE_TRACKINGS_OLDER_THAN_HOURS",
    text: `
        DELETE
        FROM maintenance_tracking tgt
        WHERE end_time < (now() - $1 * INTERVAL '1 hour')
          AND NOT EXISTS(SELECT NULL FROM maintenance_tracking t WHERE t.previous_tracking_id = tgt.id);
`,
});

export function cleanMaintenanceTrackingData(
    db: DTDatabase,
    hoursToKeep: number
): Promise<void> {
    return db.tx((t) => {
        const cleanUpQuery = t.none(
            PS_CLEAR_PREVIOUS_MAINTENANCE_TRACKING_ID_OLDER_THAN_HOURS,
            [hoursToKeep]
        );
        const deleteQuery = t.none(
            PS_DELETE_MAINTENANCE_TRACKINGS_OLDER_THAN_HOURS,
            [hoursToKeep]
        );
        // These should and must be run in given order https://github.com/vitaly-t/pg-promise/issues/307
        return t
            .batch([cleanUpQuery, deleteQuery])
            .then(() => Promise.resolve())
            .catch((error) => {
                console.error(
                    "method=cleanMaintenanceTrackingData update failed %s",
                    error
                );
                throw error;
            });
    });
}

const PS_GET_OLDEST_MAINTENANCE_TRACKING_HOURS = new PreparedStatement({
    name: "PS_GET_OLDEST_MAINTENANCE_TRACKING_HOURS",
    text: `
        select round(EXTRACT(EPOCH FROM (now() - min(end_time)))/60/60) AS hours
        from maintenance_tracking;
`,
});

export function getOldestTrackingHours(db: DTDatabase): Promise<number> {
    return db
        .tx((t) => {
            return t.one(PS_GET_OLDEST_MAINTENANCE_TRACKING_HOURS);
        })
        .then((result: { hours: number }) => result.hours);
}

export function cloneObservationsWithoutJson(
    datas: DbObservationData[]
): DbObservationData[] {
    return R.map(R.assoc("json", "{...REMOVED...}"), datas);
}
