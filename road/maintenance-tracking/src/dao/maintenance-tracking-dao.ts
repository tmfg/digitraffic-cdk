import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { default as pgPromise } from "pg-promise";
import type { DbNumberId } from "../model/db-data.js";

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
  observations: DbObservationData[],
): Promise<(DbNumberId | undefined)[]> {
  return db.tx((t) => {
    return t.batch(
      observations.map((observation) =>
        db
          .oneOrNone<DbNumberId | undefined>(
            UPSERT_MAINTENANCE_TRACKING_OBSERVATION_DATA_SQL,
            observation,
          )
          .then((result) => (result === null ? undefined : result)),
      ),
    );
  });
}

const PS_CLEAR_PREVIOUS_MAINTENANCE_TRACKING_ID_OLDER_THAN_HOURS =
  new pgPromise.PreparedStatement({
    name: "PS_CLEAR_PREVIOUS_MAINTENANCE_TRACKING_ID_OLDER_THAN_HOURS",
    text: `
        UPDATE maintenance_tracking
        SET previous_tracking_id = NULL
        WHERE end_time < (now() - $1 * INTERVAL '1 hour')
`,
  });

const PS_DELETE_MAINTENANCE_TRACKINGS_OLDER_THAN_HOURS =
  new pgPromise.PreparedStatement({
    name: "PS_DELETE_MAINTENANCE_TRACKINGS_OLDER_THAN_HOURS",
    text: `
        DELETE
        FROM maintenance_tracking tgt
        WHERE end_time < (now() - $1 * INTERVAL '1 hour')
          -- Delete only if there is no reference from later tracking to this row
          AND NOT EXISTS(SELECT NULL FROM maintenance_tracking t WHERE t.previous_tracking_id = tgt.id)
          -- Delete only, if there is at least one later tracking left to database. We need to leave at least one row/domain
          -- to get last modified date for REST API
          AND EXISTS(SELECT NULL FROM maintenance_tracking t WHERE t.domain = tgt.domain AND t.created > tgt.created);
`,
  });

export async function cleanMaintenanceTrackingData(
  db: DTDatabase,
  hoursToKeep: number,
): Promise<void> {
  await db.tx(async (t) => {
    const cleanUpQuery = t.none(
      PS_CLEAR_PREVIOUS_MAINTENANCE_TRACKING_ID_OLDER_THAN_HOURS,
      [hoursToKeep],
    );
    const deleteQuery = t.none(
      PS_DELETE_MAINTENANCE_TRACKINGS_OLDER_THAN_HOURS,
      [hoursToKeep],
    );
    // These should and must be run in given order https://github.com/vitaly-t/pg-promise/issues/307
    try {
      await t.batch([cleanUpQuery, deleteQuery]);
    } catch (error) {
      logger.error({
        method: "MaintenanceTrackingDao.cleanMaintenanceTrackingData",
        message: "cleanup failed",
        error,
      });
      throw error;
    }
  });
}

const PS_GET_OLDEST_MAINTENANCE_TRACKING_HOURS =
  new pgPromise.PreparedStatement({
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
  datas: DbObservationData[],
): DbObservationData[] {
  return datas.map((d: DbObservationData) => {
    return { ...d, json: "{...REMOVED...}" };
  });
}
