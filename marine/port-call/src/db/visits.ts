import type { LoggerMethodType } from "@digitraffic/common/dist/aws/runtime/logging/dt-logger";
import { logger } from "@digitraffic/common/dist/aws/runtime/logging/dt-logger-default";
import type {
  DTDatabase,
  DTTransaction,
} from "@digitraffic/common/dist/database/database";
import { default as pgPromise } from "pg-promise";
import type { NemoResponse, NemoVisit } from "../model/nemo.js";
import type {
  VISIT_STATUS_VALUES,
  VisitSort,
  VisitStatus,
} from "../model/visit-schema.js";

export interface DbInsertedUpdated {
  readonly inserted: number;
  readonly updated: number;
}

export interface DbVisit {
  readonly visit_id: string;
  readonly vessel_id: string;
  readonly vessel_name: string;
  readonly ship_call_sign?: string;
  readonly mmsi?: string;
  readonly vessel_type?: string;
  readonly gross_tonnage?: number;
  readonly net_tonnage?: number;
  readonly length?: number;
  readonly breadth?: number;
  readonly height?: number;
  readonly declarant_name?: string;
  readonly port_locode: string;
  readonly port_name?: string;
  readonly prev_port_locode?: string;
  readonly prev_port_name?: string;
  readonly next_port_locode?: string;
  readonly next_port_name?: string;
  readonly port_area_code?: string;
  readonly port_area_name?: string;
  readonly berth_name?: string;
  readonly berth_code?: string;
  readonly eta: Date;
  readonly etd?: Date;
  readonly ata?: Date;
  readonly atd?: Date;
  readonly status: (typeof VISIT_STATUS_VALUES)[number];
  readonly update_time: Date;
}

const UPSERT_VISITS_SQL = `INSERT INTO pc2_visit(visit_id, vessel_id, vessel_name, ship_call_sign, mmsi, vessel_type, gross_tonnage, net_tonnage, length, breadth, height, declarant_name, port_locode, port_name, prev_port_locode, prev_port_name, next_port_locode, next_port_name, port_area_code, port_area_name, berth_name, berth_code, eta, etd, ata, atd, status, update_time)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
ON CONFLICT(visit_id)
DO UPDATE SET
  ship_call_sign = EXCLUDED.ship_call_sign,
  mmsi = EXCLUDED.mmsi,
  vessel_type = EXCLUDED.vessel_type,
  gross_tonnage = EXCLUDED.gross_tonnage,
  net_tonnage = EXCLUDED.net_tonnage,
  length = EXCLUDED.length,
  breadth = EXCLUDED.breadth,
  height = EXCLUDED.height,
  declarant_name = EXCLUDED.declarant_name,
  port_locode = EXCLUDED.port_locode,
  port_name = EXCLUDED.port_name,
  prev_port_locode = EXCLUDED.prev_port_locode,
  prev_port_name = EXCLUDED.prev_port_name,
  next_port_locode = EXCLUDED.next_port_locode,
  next_port_name = EXCLUDED.next_port_name,
  port_area_code = EXCLUDED.port_area_code,
  port_area_name = EXCLUDED.port_area_name,
  berth_name = EXCLUDED.berth_name,
  berth_code = EXCLUDED.berth_code,
  eta = EXCLUDED.eta,
  etd = EXCLUDED.etd,
  ata = EXCLUDED.ata,
  atd = EXCLUDED.atd,
  status = EXCLUDED.status,
  update_time = EXCLUDED.update_time
WHERE ( pc2_visit.ship_call_sign IS DISTINCT FROM EXCLUDED.ship_call_sign
  OR pc2_visit.mmsi IS DISTINCT FROM EXCLUDED.mmsi
  OR pc2_visit.vessel_type IS DISTINCT FROM EXCLUDED.vessel_type
  OR pc2_visit.gross_tonnage IS DISTINCT FROM EXCLUDED.gross_tonnage
  OR pc2_visit.net_tonnage IS DISTINCT FROM EXCLUDED.net_tonnage
  OR pc2_visit.length IS DISTINCT FROM EXCLUDED.length
  OR pc2_visit.breadth IS DISTINCT FROM EXCLUDED.breadth
  OR pc2_visit.height IS DISTINCT FROM EXCLUDED.height
  OR pc2_visit.declarant_name IS DISTINCT FROM EXCLUDED.declarant_name
  OR pc2_visit.port_locode IS DISTINCT FROM EXCLUDED.port_locode
  OR pc2_visit.port_name IS DISTINCT FROM EXCLUDED.port_name
  OR pc2_visit.prev_port_locode IS DISTINCT FROM EXCLUDED.prev_port_locode
  OR pc2_visit.prev_port_name IS DISTINCT FROM EXCLUDED.prev_port_name
  OR pc2_visit.next_port_locode IS DISTINCT FROM EXCLUDED.next_port_locode
  OR pc2_visit.next_port_name IS DISTINCT FROM EXCLUDED.next_port_name
  OR pc2_visit.port_area_code IS DISTINCT FROM EXCLUDED.port_area_code
  OR pc2_visit.port_area_name IS DISTINCT FROM EXCLUDED.port_area_name
  OR pc2_visit.berth_name IS DISTINCT FROM EXCLUDED.berth_name
  OR pc2_visit.berth_code IS DISTINCT FROM EXCLUDED.berth_code
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

  if (response.length === 0) {
    return { inserted: 0, updated: 0 };
  }

  return db
    .tx<DbInsertedUpdated>(async (tx) => {
      let inserted = 0;
      let updated = 0;
      for (const visit of response) {
        const result = await upsertVisit(tx, visit);
        inserted += result.inserted;
        updated += result.updated;
      }
      return { inserted, updated };
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

  // visit_id, vessel_id, vessel_name, ship_call_sign, mmsi, vessel_type, gross_tonnage, net_tonnage, length, breadth, height, declarant_name, port_locode, port_name, prev_port_locode, prev_port_name, next_port_locode, next_port_name, port_area_code, port_area_name, berth_name, berth_code, eta, etd, ata, atd, status, update_time
  return db
    .oneOrNone<DbInsertedUpdated>(UPSERT_VISITS_SQL, [
      visit.visitId,
      visit.portCall.vesselInformation.identification,
      visit.portCall.vesselInformation.name,
      visit.portCall.vesselInformation.shipCallSign,
      visit.portCall.vesselInformation.mmsiNumber,
      visit.portCall.vesselInformation.vesselType,
      visit.portCall.vesselInformation.grossTonnage,
      visit.portCall.vesselInformation.netTonnage,
      visit.portCall.vesselInformation.length,
      visit.portCall.vesselInformation.breadth,
      visit.portCall.vesselInformation.height,
      visit.portCall.declarantName,
      visit.portCall.voyageInformation.portIdentification,
      visit.portCall.voyageInformation.portLocation,
      visit.portCall.voyageInformation.previousPortIdentification,
      visit.portCall.voyageInformation.previousPortName,
      visit.portCall.voyageInformation.nextPortIdentification,
      visit.portCall.voyageInformation.nextPortName,
      visit.portCall.voyageInformation.portAreaCode,
      visit.portCall.voyageInformation.portAreaName,
      visit.portCall.voyageInformation.berthName,
      visit.portCall.voyageInformation.berthCode,
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
  text: `select visit_id, vessel_id, vessel_name, ship_call_sign, mmsi, vessel_type, gross_tonnage, net_tonnage, length, breadth, height, declarant_name, port_locode, port_name, prev_port_locode, prev_port_name, next_port_locode, next_port_name, port_area_code, port_area_name, berth_name, berth_code, eta, etd, ata, atd, status, update_time 
    from pc2_visit
    where (
      ($1::timestamptz is null and $2::timestamptz is null)
      or (eta is not null and ($1::timestamptz is null or eta >= $1) and ($2::timestamptz is null or eta < $2))
      or (etd is not null and ($1::timestamptz is null or etd >= $1) and ($2::timestamptz is null or etd < $2))
      or (ata is not null and ($1::timestamptz is null or ata >= $1) and ($2::timestamptz is null or ata < $2))
      or (atd is not null and ($1::timestamptz is null or atd >= $1) and ($2::timestamptz is null or atd < $2))
    )
    and ($3::text is null or port_locode = $3)
    and ($4::text is null or vessel_name ILIKE '%' || $4 || '%')
    and ($5::text is null or vessel_id = $5::text)
    and ($6::text is null or status = $6)
    and eta >= now() - interval '3 months'
    and eta <= now() + interval '3 months'
    order by
      case when $8 = 'asc' then
        case $7
          when 'eta' then eta::text
          when 'etd' then etd::text
          when 'ata' then ata::text
          when 'atd' then atd::text
          when 'vesselName' then vessel_name
          when 'portOfCall' then port_locode
          when 'status' then status
        end
      end asc nulls last,
      case when $8 = 'desc' then
        case $7
          when 'eta' then eta::text
          when 'etd' then etd::text
          when 'ata' then ata::text
          when 'atd' then atd::text
          when 'vesselName' then vessel_name
          when 'portOfCall' then port_locode
          when 'status' then status
        end
      end desc nulls last,
      case when $7 is null then coalesce(ata, eta) end asc`,
});

export function findAllVisits(
  db: DTDatabase,
  from?: Date,
  to?: Date,
  locode?: string,
  vesselName?: string,
  imo?: number,
  status?: VisitStatus,
  sort?: VisitSort,
): Promise<DbVisit[]> {
  return db.manyOrNone(FIND_ALL_VISITS_PS, [
    from,
    to,
    locode,
    vesselName,
    imo,
    status,
    sort?.field,
    sort?.direction,
  ]);
}

const FIND_VISIT_PS = new pgPromise.PreparedStatement({
  name: "find-visit",
  text: `select visit_id, vessel_id, vessel_name, ship_call_sign, mmsi, vessel_type, gross_tonnage, net_tonnage, length, breadth, height, declarant_name, port_locode, port_name, prev_port_locode, prev_port_name, next_port_locode, next_port_name, port_area_code, port_area_name, berth_name, berth_code, eta, etd, ata, atd, status, update_time 
   from pc2_visit 
   where visit_id = $1`,
});

export async function findVisit(
  db: DTDatabase,
  visitId: string,
): Promise<DbVisit | undefined> {
  return (await db.oneOrNone(FIND_VISIT_PS, [visitId])) ?? undefined;
}
