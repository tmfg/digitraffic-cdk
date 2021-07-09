import * as SseSchema from "../generated/tlsc-sse-reports-schema";
import {DbSseReport, insertSseReportData, updateLatestSiteToFalse} from "../db/sse-db";
import {inDatabase} from '../../../../common/postgres/database';
import {IDatabase} from "pg-promise";

export async function saveSseData(sseReport: SseSchema.TheSSEReportRootSchema) : Promise<number> {
    return await inDatabase(async (db: IDatabase<any,any>) => {
        return Promise.allSettled(sseReport.SSE_Reports.map(async (report: SseSchema.TheItemsSchema) => {
            try {
                const dbSseSseReport = convertToDbSseReport(report);
                return await db.tx(async t => {
                    return t.batch([
                        updateLatestSiteToFalse(t, dbSseSseReport.siteNumber),
                        insertSseReportData(t, dbSseSseReport)
                    ]);
                }).then(function (result) {
                    console.info(`method=saveSseData Done`);
                    return result;
                });
            } catch (e) {
                console.error(`method=saveSseData Error while handling record`, e);
                return Promise.reject(e);
            }
        })).then(function (results) {
            return results.filter((r) => { return r.status === 'fulfilled' }).length;
        });
    });
}

export function convertToDbSseReport(sseReport: SseSchema.TheItemsSchema) : DbSseReport {

    if (!sseReport.Extra_Fields?.Coord_Latitude) {
        throw new Error('Missing Coord_Latitude');
    } else if (!sseReport.Extra_Fields?.Coord_Longitude) {
        throw new Error('Missing Coord_Latitude');
    }

    const data: DbSseReport = {
        siteNumber: sseReport.Site.SiteNumber,
        siteName: sseReport.Site.SiteName,
        siteType: sseReport.Site.SiteType,

        lastUpdate: sseReport.SSE_Fields.Last_Update,
        confidence: sseReport.SSE_Fields.Confidence,
        seaState: sseReport.SSE_Fields.SeaState,
        trend: sseReport.SSE_Fields.Trend,
        windWaveDir: sseReport.SSE_Fields.WindWaveDir,

        heelAngle: sseReport.Extra_Fields?.Heel_Angle,
        lightStatus: sseReport.Extra_Fields?.Light_Status,
        temperature: sseReport.Extra_Fields?.Temperature,
        longitude: sseReport.Extra_Fields?.Coord_Longitude ?? -1,
        latitude: sseReport.Extra_Fields?.Coord_Latitude ?? -1
    };
    return data;
}

