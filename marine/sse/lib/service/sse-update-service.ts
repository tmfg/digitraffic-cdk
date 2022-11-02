import {
    DTDatabase,
    inDatabase,
} from "@digitraffic/common/dist/database/database";
import * as LastUpdatedDB from "@digitraffic/common/dist/database/last-updated";
import * as SseDb from "../db/sse-db";
import * as SseSchema from "../generated/tlsc-sse-reports-schema";

export const SSE_DATA_DATA_TYPE = "SSE_DATA";

export interface SseSaveResult {
    readonly saved: number;
    readonly errors: number;
}

export function saveSseData(
    sseReport: SseSchema.TheSseReportsSchema
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
                            SseDb.updateLatestSiteToFalse(
                                t,
                                dbSseSseReport.siteNumber
                            ),
                            SseDb.insertSseReportData(t, dbSseSseReport),
                            LastUpdatedDB.updateUpdatedTimestamp(
                                t,
                                SSE_DATA_DATA_TYPE,
                                new Date()
                            ),
                        ]);
                    })
                    .then(() => {
                        saved++;
                        console.info("method=saveSseData succeed");
                    })
                    .catch((error) => {
                        errors++;
                        console.error(
                            "method=saveSseData update failed",
                            error
                        );
                    });
            } catch (e) {
                console.error(
                    "method=saveSseData Error while handling record",
                    e
                );
                errors++;
            }
        }
        const result: SseSaveResult = {
            errors,
            saved,
        };
        console.info(`method=saveSseData result ${JSON.stringify(result)}`);
        return result;
    });
}

export function convertToDbSseReport(
    sseReport: SseSchema.TheItemsSchema
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
