import {DTDatabase} from "@digitraffic/common/database/database";
import * as LastUpdatedDB from "@digitraffic/common/database/last-updated";
import * as SseDb from "../../lib/db/sse-db";
import * as SSESchema from "../../lib/generated/tlsc-sse-reports-schema";
import * as SseUpdateService from "../../lib/service/sse-update-service";
import * as DbTestutil from "../db-testutil";
import * as Testdata from "../testdata";

describe('sse-update-service-test', DbTestutil.dbTestBase((db: DTDatabase) => {

    test('save report', async () => {
        const start = new Date();
        const sseReportsFromDbBefore: SseDb.DbSseReport[] = await DbTestutil.findAllSseReports(db);
        const sseReport: SSESchema.TheSSEReportRootSchema = Testdata.createSampleData([Testdata.site1]);
        const savedCount = await SseUpdateService.saveSseData(sseReport);
        expect(savedCount.saved).toBe(1);

        const sseReportsFromDb: SseDb.DbSseReport[] = await DbTestutil.findAllSseReports(db);
        expect(sseReportsFromDb.length).toBe(sseReportsFromDbBefore.length + 1);
        const lastUpdated = await LastUpdatedDB.getUpdatedTimestamp(db, SseUpdateService.SSE_DATA_DATA_TYPE);
        const end = new Date();
        expect(lastUpdated && start <= lastUpdated && lastUpdated <= end).toBe(true);
    });

    test('replace latest report', async () => {
        const sseReport: SSESchema.TheSSEReportRootSchema = Testdata.createSampleData([Testdata.site1]);
        sseReport.SSE_Reports[0].SSE_Fields.SeaState = "CALM";
        await SseUpdateService.saveSseData(sseReport);
        sseReport.SSE_Reports[0].SSE_Fields.SeaState = "BREEZE";
        await SseUpdateService.saveSseData(sseReport);

        const sseReportsFromDb: SseDb.DbSseReport[] = await DbTestutil.findAllSseReports(db, Testdata.site1.Site.SiteNumber);
        expect(sseReportsFromDb.length).toBe(2);

        expect(sseReportsFromDb[0].latest).toBe(false);
        expect(sseReportsFromDb[1].latest).toBe(true);
        expect(sseReportsFromDb[0].seaState).toBe("CALM");
        expect(sseReportsFromDb[1].seaState).toBe("BREEZE");
    });

    test('save multiple reports for same site', async () => {
        const start = new Date();
        const sseReportsFromDbBefore: SseDb.DbSseReport[] = await DbTestutil.findAllSseReports(db);
        const sseReport: SSESchema.TheSSEReportRootSchema = Testdata.createSampleData([Testdata.site1, Testdata.site1, Testdata.site1, Testdata.site1,Testdata.site1]);
        const savedCount = await SseUpdateService.saveSseData(sseReport);
        expect(savedCount.saved).toBe(5);

        const sseReportsFromDb: SseDb.DbSseReport[] = await DbTestutil.findAllSseReports(db);
        expect(sseReportsFromDb.length).toBe(sseReportsFromDbBefore.length + 5);
        const lastUpdated = await LastUpdatedDB.getUpdatedTimestamp(db, SseUpdateService.SSE_DATA_DATA_TYPE);
        const end = new Date();
        expect(lastUpdated && start <= lastUpdated && lastUpdated <= end).toBe(true);
    });
}));



