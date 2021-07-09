import * as DbTestutil from "../db-testutil";
import * as PgPromise from "pg-promise";
import * as Testdata from "../testdata";
import * as SseUpdateService from "../../lib/service/sse-update-service"
import * as SseDb from "../../lib/db/sse-db";

describe('sse-db-test', DbTestutil.dbTestBase((db: PgPromise.IDatabase<any, any>) => {

    test('insert sse report', async () => {
        const all = await DbTestutil.findAllSseReports(db);
        expect(all.length).toBe(0);
        await SseDb.insertSseReportData(db, SseUpdateService.convertToDbSseReport(Testdata.site1));

        const allAfterInsert = await DbTestutil.findAllSseReports(db);
        expect(allAfterInsert.length).toBe(1);
        expect(allAfterInsert[0].latest).toBe(true);
    });

    test('update sse report latest status', async () => {
        // Create 2 reports and update first latest => false
        const siteNum1 = Testdata.site1.Site.SiteNumber;
        const siteNum2 = Testdata.site2.Site.SiteNumber;

        await db.tx(t => {
            return t.batch([
                SseDb.insertSseReportData(db, SseUpdateService.convertToDbSseReport(Testdata.site1)),
                SseDb.insertSseReportData(db, SseUpdateService.convertToDbSseReport(Testdata.site2)),
                SseDb.updateLatestSiteToFalse(db, siteNum1)
            ]);
        });

        // Expect to find first as false and second as true latest status
        const afterUpdate: SseDb.DbSseReport[] = await DbTestutil.findAllSseReports(db);
        expect(afterUpdate.length).toBe(2);
        const site1Reports: SseDb.DbSseReport[] = afterUpdate.filter(r => r.siteNumber === siteNum1);
        const site2Reports: SseDb.DbSseReport[] = afterUpdate.filter(r => r.siteNumber === siteNum2);
        expect(site1Reports.length).toBe(1);
        expect(site2Reports.length).toBe(1);
        expect(site1Reports[0].latest).toBe(false);
        expect(site2Reports[0].latest).toBe(true);
    });
}));