import type { LoggerMethodType } from "@digitraffic/common/dist/aws/runtime/dt-logger";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type {
  DTDatabase,
  DTTransaction,
} from "@digitraffic/common/dist/database/database";
import { default as pgPromise } from "pg-promise";
import type { NemoResponse, NemoVisit } from "../model/nemo.js";
import type { VISIT_STATUS_VALUES } from "../model/visit-schema.js";

export interface DbInsertedUpdated {
  readonly inserted: number;
  readonly updated: number;
}

export interface DbVisit {
  readonly visit_id: string;
  readonly vessel_id: string;
  readonly vessel_name: string;
  readonly port_locode: string;
  readonly eta: Date;
  readonly etd?: Date;
  readonly ata?: Date;
  readonly atd?: Date;
  readonly status: (typeof VISIT_STATUS_VALUES)[number];
  readonly update_time: Date;
}

const UPSERT_VISITS_SQL = `INSERT INTO pc2_visit(visit_id, vessel_id, vessel_name, port_locode, eta, etd, ata, atd, status, update_time)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
ON CONFLICT(visit_id)
DO UPDATE SET
    port_locode = EXCLUDED.port_locode,
    eta = EXCLUDED.eta,
    etd = EXCLUDED.etd,
    ata = EXCLUDED.ata,
    atd = EXCLUDED.atd,
    status = EXCLUDED.status,
    update_time = EXCLUDED.update_time
WHERE ( pc2_visit.port_locode IS DISTINCT FROM EXCLUDED.port_locode
    OR pc2_visit.eta IS DISTINCT FROM EXCLUDED.eta
    OR pc2_visit.etd IS DISTINCT FROM EXCLUDED.etd
    OR pc2_visit.ata IS DISTINCT FROM EXCLUDED.ata
    OR pc2_visit.atd IS DISTINCT FROM EXCLUDED.atd
    OR pc2_visit.status IS DISTINCT FROM EXCLUDED.status)
returning (xmax = 0)::int AS inserted, (xmax <> 0)::int AS updated`;

export async function upsertVisits(
  db: DTDatabase,
  response: NemoResponse,
): Promise<DbInsertedUpdated> {
  const method = `VisitsDAO.upsertVisits` satisfies LoggerMethodType;

  return db
    .tx<DbInsertedUpdated>((tx) => {
      return tx
        .batch<DbInsertedUpdated>(
          response.map((visit) => upsertVisit(tx, visit)),
        )
        .then((results: DbInsertedUpdated[]) => {
          const inserted = results
            .map((r) => r.inserted)
            .reduce((a: number, b: number) => a + b);
          const updated = results.map((r) => r.updated).reduce((a, b) => a + b);
          return { inserted: inserted, updated: updated };
        });
    })
    .catch((error: unknown) => {
      logger.error({
        method,
        message: "failed",
        error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    });
}

export async function upsertVisit(
  db: DTDatabase | DTTransaction,
  visit: NemoVisit,
): Promise<DbInsertedUpdated> {
  const method = `VisitsDAO.upsertVisit` satisfies LoggerMethodType;

  // visit_id, vessel_id, vessel_name, port_locode, eta, etd, ata, atd, status, update_time
  return db
    .oneOrNone<DbInsertedUpdated>(UPSERT_VISITS_SQL, [
      visit.visitId,
      visit.portCall.vesselInformation.identification,
      visit.portCall.vesselInformation.name,
      visit.portCall.voyageInformation.portIdentification,
      visit.portCall.voyageInformation.estimatedArrivalDateTime,
      visit.portCall.voyageInformation.estimatedDepartureDateTime,
      visit.portCall.arrivalNotification.actualArrivalDateTime,
      visit.portCall.departureNotification.actualDepartureDateTime,
      visit.portCall.portCallStatus.status,
      visit.latestUpdateTime,
    ])
    .then((value: DbInsertedUpdated | null): DbInsertedUpdated => {
      return value ? value : { inserted: 0, updated: 0 };
    })
    .catch((error: unknown) => {
      logger.error({
        method,
        message: `Failed to save visit: ${JSON.stringify(visit)}`,
        error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    });
}

const FIND_ALL_VISITS_PS = new pgPromise.PreparedStatement({
  name: "find-all-visits",
  text: `select visit_id, vessel_id, vessel_name, port_locode, eta, etd, ata, atd, status, update_time 
    from pc2_visit
    where ($1::timestamptz is null or update_time >= $1::timestamptz)
    and ($2::timestamptz is null or update_time < $2::timestamptz)`,
});

export function findAllVisits(
  db: DTDatabase,
  from: Date | undefined,
  to: Date | undefined,
): Promise<DbVisit[]> {
  return db.manyOrNone(FIND_ALL_VISITS_PS, [from, to]);
}

const FIND_VISIT_PS = new pgPromise.PreparedStatement({
  name: "find-visit",
  text: "select visit_id, vessel_id, vessel_name, port_locode, eta, etd, ata, atd, status, update_time from pc2_visit where visit_id = $1",
});

export async function findVisit(
  db: DTDatabase,
  visitId: string,
): Promise<DbVisit | undefined> {
  return (await db.oneOrNone(FIND_VISIT_PS, [visitId])) ?? undefined;
}
