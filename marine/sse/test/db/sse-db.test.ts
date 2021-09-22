import * as DbTestutil from "../db-testutil";
import * as PgPromise from "pg-promise";
import * as Testdata from "../testdata";
import * as SseUpdateService from "../../lib/service/sse-update-service"
import * as SseDb from "../../lib/db/sse-db";
import {TheItemsSchema} from "../../lib/generated/tlsc-sse-reports-schema";

describe('sse-db-test', DbTestutil.dbTestBase((db: PgPromise.IDatabase<any, any>) => {

    test('insert sse report', async () => {
        await updateLatestAndInsertData([Testdata.site1]);

        const allAfterInsert = await DbTestutil.findAllSseReports(db);
        expect(allAfterInsert.length).toBe(1);
        expect(allAfterInsert[0].latest).toBe(true);
    });

    test('update sse report latest status', async () => {
        // Create 2 reports and update first latest => false
        const siteNum1 = Testdata.site1.Site.SiteNumber;
        const siteNum2 = Testdata.site2.Site.SiteNumber;
        await updateLatestAndInsertData([Testdata.site1, Testdata.site2]);
        const allAfter1Update: SseDb.DbSseReport[] = await DbTestutil.findAllSseReports(db);
        const site1ReportsAfter1stUpdate: SseDb.DbSseReport[] = allAfter1Update.filter(r => r.siteNumber === siteNum1);
        const site2ReportsAfter1stUpdate : SseDb.DbSseReport[] = allAfter1Update.filter(r => r.siteNumber === siteNum2);

        await updateLatestAndInsertData([Testdata.site1, Testdata.site2]);

        // Expect to find first latest status as false and second latest status as true
        const allAfter2ndUpdate: SseDb.DbSseReport[] = await DbTestutil.findAllSseReports(db);
        expect(allAfter2ndUpdate.length).toBe(4);
        const site1ReportsAfter2ndUpdate: SseDb.DbSseReport[] = allAfter2ndUpdate.filter(r => r.siteNumber === siteNum1);
        const site2Reports2ndUpdate: SseDb.DbSseReport[] = allAfter2ndUpdate.filter(r => r.siteNumber === siteNum2);
        expect(site1ReportsAfter2ndUpdate.length).toBe(2);
        expect(site2Reports2ndUpdate.length).toBe(2);

        // Latest values must be true
        expect(site1ReportsAfter2ndUpdate[1].latest).toBe(true);
        expect(site2Reports2ndUpdate[1].latest).toBe(true);
        // Previous values must be false
        expect(site1ReportsAfter2ndUpdate[0].latest).toBe(false);
        expect(site2Reports2ndUpdate[0].latest).toBe(false);
    });

    async function updateLatestAndInsertData(reports: TheItemsSchema[]) {
        // Update latest records to false
        await db.tx(t => {
            const promises : Promise<any>[] = reports.map(report => SseDb.updateLatestSiteToFalse(t, report.Site.SiteNumber));
            return t.batch(promises);
        });
        // Insert new latest records
        await db.tx(t => {
            const promises : Promise<any>[] = reports.map(report =>
                SseDb.insertSseReportData(t, SseUpdateService.convertToDbSseReport(report))
            );
            return t.batch(promises);
        });
    }


}));