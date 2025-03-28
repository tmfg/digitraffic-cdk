import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { dbTestBase as commonDbTestBase } from "@digitraffic/common/dist/test/db-testutils";
import type { DbSseReport } from "../db/sse-db.js";

export function dbTestBase(
  fn: (db: DTDatabase) => void,
): ReturnType<typeof commonDbTestBase> {
  return commonDbTestBase(
    fn,
    truncate,
    "marine",
    "marine",
    "localhost:54321/marine",
  );
}

export async function truncate(db: DTDatabase): Promise<void> {
  await db.tx((t) => {
    return t.batch([db.none("DELETE FROM sse_report")]);
  });
}

export function findAllSseReports(
  db: DTDatabase,
  siteId?: number,
): Promise<DbSseReport[]> {
  const where = siteId ? `WHERE site_number=${siteId}` : "";

  return db.tx((t) => {
    return t.manyOrNone(`
            SELECT sse_report_id as "sseReportId",
                   created       as "created",
                   latest        as "latest",
                   site_number   as "siteNumber",
                   site_name     as "siteName",
                   last_update   as "lastUpdate",
                   sea_state     as "seaState",
                   trend         as "trend",
                   wind_wave_dir as "windWaveDir",
                   confidence    as "cofidence",
                   heel_angle    as "heelAngle",
                   light_status  as "lightStatus",
                   temperature   as "temperature",
                   longitude     as "longiture",
                   latitude      as "latitude",
                   site_type     as "siteType"
            FROM sse_report ${where}
            ORDER BY site_number, sse_report_id
        `);
  });
}
