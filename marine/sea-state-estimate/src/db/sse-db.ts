import type { DTTransaction } from "@digitraffic/common/dist/database/database";
import pgPromise from "pg-promise";
import type {
  TheConfidenceSchema,
  TheCoordLatitudeSchema,
  TheCoordLongitudeSchema,
  TheHeelAngleSchema,
  TheLastUpdateSchema,
  TheLightStatusSchema,
  TheSeastateSchema,
  TheSiteTypeSchema,
  TheTemperatureSchema,
  TheTrendSchema,
  TheWindwavedirSchema,
} from "../generated/tlsc-sse-reports-schema.js";

const { PreparedStatement } = pgPromise;

export interface DbSseReport {
  readonly sseReportId?: bigint;
  readonly created?: Date;
  readonly latest?: boolean;
  readonly siteNumber: number;
  readonly siteName: string;
  readonly lastUpdate: TheLastUpdateSchema;
  readonly seaState: TheSeastateSchema;
  readonly trend: TheTrendSchema;
  readonly windWaveDir: TheWindwavedirSchema;
  readonly confidence: TheConfidenceSchema;
  readonly heelAngle?: TheHeelAngleSchema;
  readonly lightStatus?: TheLightStatusSchema;
  readonly temperature?: TheTemperatureSchema;
  readonly longitude: TheCoordLongitudeSchema;
  readonly latitude: TheCoordLatitudeSchema;
  readonly siteType?: TheSiteTypeSchema;
}

const UPDATE_LATEST_SITE_TO_FALSE_SQL = `
    UPDATE SSE_REPORT
    SET latest = false
    WHERE latest = true
      AND site_number = $1`;

const INSERT_SSE_REPORT_SQL = `
    INSERT INTO SSE_REPORT(
        sse_report_id,
        created,
        latest,
        site_number,
        site_name,
        last_update,
        sea_state,
        trend,
        wind_wave_dir,
        confidence,
        heel_angle,
        light_status,
        temperature,
        longitude,
        latitude, -- numeric(10,7) not null,
        site_type)
    VALUES(
        NEXTVAL('SEQ_SSE_REPORT'),
        now(),
        true,
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13
    )
`;

const psUpdateLatestSite = new PreparedStatement({
  name: "update-sse-report-latest-site",
  text: UPDATE_LATEST_SITE_TO_FALSE_SQL,
});

export function updateLatestSiteToFalse(
  db: DTTransaction,
  siteNumber: number,
  // eslint-disable-next-line @rushstack/no-new-null
): Promise<null> {
  return db.none(psUpdateLatestSite, siteNumber);
}

export function insertSseReportData(
  db: DTTransaction,
  sseData: DbSseReport,
  // eslint-disable-next-line @rushstack/no-new-null
): Promise<null> {
  const ps = new PreparedStatement({
    name: "update-sse-report",
    text: INSERT_SSE_REPORT_SQL,
  });
  return db.none(ps, createInsertValuesArray(sseData));
}

export function createInsertValuesArray(e: DbSseReport): unknown[] {
  return [
    e.siteNumber,
    e.siteName,
    e.lastUpdate,
    e.seaState,
    e.trend,
    e.windWaveDir,
    e.confidence,
    e.heelAngle,
    e.lightStatus,
    e.temperature,
    e.longitude,
    e.latitude,
    e.siteType,
  ];
}
