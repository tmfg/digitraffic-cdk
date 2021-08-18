import * as SseSchema from "../generated/tlsc-sse-reports-schema";
import * as SseDb from "../db/sse-db";
import {inDatabase} from 'digitraffic-common/postgres/database';
import {IDatabase} from "pg-promise";
import * as LastUpdatedDB from "digitraffic-common/db/last-updated";

export const SSE_DATA_DATA_TYPE = "SSE_DATA";

export async function saveSseData(sseReport: SseSchema.TheSSEReportRootSchema) : Promise<number> {
    return inDatabase(async (db: IDatabase<any,any>) => {
        return Promise.allSettled(sseReport.SSE_Reports.map(async (report: SseSchema.TheItemsSchema) => {
            try {
                const dbSseSseReport = convertToDbSseReport(report);
                return db.tx(async t => {
                    return t.batch([
                        SseDb.updateLatestSiteToFalse(t, dbSseSseReport.siteNumber),
                        SseDb.insertSseReportData(t, dbSseSseReport),
                        LastUpdatedDB.updateUpdatedTimestamp(t, SSE_DATA_DATA_TYPE, new Date())
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

export function convertToDbSseReport(sseReport: SseSchema.TheItemsSchema) : SseDb.DbSseReport {

    if (!sseReport.Extra_Fields?.Coord_Latitude) {
        throw new Error('Missing Coord_Latitude');
    } else if (!sseReport.Extra_Fields?.Coord_Longitude) {
        throw new Error('Missing Coord_Longitude');
    }

    const data: SseDb.DbSseReport = {
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

