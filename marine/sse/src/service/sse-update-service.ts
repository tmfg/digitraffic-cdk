import {
  type DTDatabase,
  inDatabase,
} from "@digitraffic/common/dist/database/database";
import * as LastUpdatedDB from "@digitraffic/common/dist/database/last-updated";
import * as SseDb from "../db/sse-db.js";
import type * as SseSchema from "../generated/tlsc-sse-reports-schema.d.ts";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export const SSE_DATA_DATA_TYPE = "SSE_DATA";

export interface SseSaveResult {
  readonly saved: number;
  readonly errors: number;
}

export function saveSseData(
  sseReport: SseSchema.TheSseReportsSchema,
): Promise<SseSaveResult> {
  return inDatabase(async (db: DTDatabase) => {
    let saved = 0;
    let errors = 0;

    for (const report of sseReport) {
      try {
        const dbSseSseReport = convertToDbSseReport(report);
        await db
          .tx((t) => {
            return t.batch([
              SseDb.updateLatestSiteToFalse(t, dbSseSseReport.siteNumber),
              SseDb.insertSseReportData(t, dbSseSseReport),
              LastUpdatedDB.updateUpdatedTimestamp(
                t,
                SSE_DATA_DATA_TYPE,
                new Date(),
              ),
            ]);
          })
          .then(() => {
            saved++;
            logger.info({
              method: "sse-update-service.saveSseData",
              message: "succeed",
            });
          })
          .catch((e: Error) => {
            errors++;
            logger.error({
              method: "sse-update-service.saveSseData",
              message: "update failed",
              error: e,
            });
          });
      } catch (e) {
        logger.error({
          method: "sse-update-service.saveSseData",
          message: "Error while handling record",
          error: e,
        });
        errors++;
      }
    }
    const result: SseSaveResult = {
      errors,
      saved,
    };
    logger.info({
      method: "sse-update-service.saveSseData",
      message: `result ${JSON.stringify(result)}`,
    });
    return result;
  });
}

export function convertToDbSseReport(
  sseReport: SseSchema.TheItemsSchema,
): SseDb.DbSseReport {
  if (!sseReport.Extra_Fields) {
    throw new Error("Missing Extra_Fields");
  }
  if (!sseReport.Extra_Fields.Coord_Latitude) {
    throw new Error("Missing Coord_Latitude");
  } else if (!sseReport.Extra_Fields.Coord_Longitude) {
    throw new Error("Missing Coord_Longitude");
  }

  return {
    siteNumber: sseReport.Site.SiteNumber,
    siteName: sseReport.Site.SiteName,
    siteType: sseReport.Site.SiteType,

    lastUpdate: sseReport.SSE_Fields.Last_Update,
    confidence: sseReport.SSE_Fields.Confidence,
    seaState: sseReport.SSE_Fields.SeaState,
    trend: sseReport.SSE_Fields.Trend,
    windWaveDir: sseReport.SSE_Fields.WindWaveDir,

    heelAngle: sseReport.Extra_Fields.Heel_Angle,
    lightStatus: sseReport.Extra_Fields.Light_Status,
    temperature: sseReport.Extra_Fields.Temperature,
    longitude: sseReport.Extra_Fields.Coord_Longitude,
    latitude: sseReport.Extra_Fields.Coord_Latitude,
  };
}
