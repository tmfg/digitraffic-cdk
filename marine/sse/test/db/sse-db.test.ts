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
        expect(allAfterInsert[allAfterInsert.length-1].latest).toBe(true);
    });

    test('update sse report latest status', async () => {
        // Create 2 reports and update first latest => false
        const siteNum1 = Testdata.site1.Site.SiteNumber;
        const siteNum2 = Testdata.site2.Site.SiteNumber;
        await updateLatestAndInsertData([Testdata.site1, Testdata.site2]);
        const beforeUpdate: SseDb.DbSseReport[] = await DbTestutil.findAllSseReports(db);
        const site1ReportsBefore: SseDb.DbSseReport[] = beforeUpdate.filter(r => r.siteNumber === siteNum1);
        const site2ReportsBefore : SseDb.DbSseReport[] = beforeUpdate.filter(r => r.siteNumber === siteNum2);

        await updateLatestAndInsertData([Testdata.site1, Testdata.site2]);

        // Expect to find first as false and second as true latest status
        const afterUpdate: SseDb.DbSseReport[] = await DbTestutil.findAllSseReports(db);
        expect(afterUpdate.length).toBe(beforeUpdate.length+2);
        const site1Reports: SseDb.DbSseReport[] = afterUpdate.filter(r => r.siteNumber === siteNum1);
        const site2Reports: SseDb.DbSseReport[] = afterUpdate.filter(r => r.siteNumber === siteNum2);
        expect(site1Reports.length).toBe(site1ReportsBefore.length + 1);
        expect(site2Reports.length).toBe(site2ReportsBefore.length + 1);

        expect(site1Reports[site1Reports.length-1].latest).toBe(true);
        expect(site2Reports[site2Reports.length-1].latest).toBe(true);

        if (site1ReportsBefore.length > 0) {
            expect(site1Reports[site1Reports.length-2].latest).toBe(false); // previous false
        }
        if (site2ReportsBefore.length > 0) {
            expect(site2Reports[site2Reports.length-2].latest).toBe(false); // previous false
        }
    });

    async function updateLatestAndInsertData(reports: TheItemsSchema[]) {
        // Update latest records to false
        await db.tx(t => {
            const functions : Promise<any>[] = reports.map(report => SseDb.updateLatestSiteToFalse(t, report.Site.SiteNumber));
            return t.batch(functions);
        });
        // Insert new latest records
        await db.tx(t => {
            const functions : Promise<any>[] = reports.map(report =>
                SseDb.insertSseReportData(t, SseUpdateService.convertToDbSseReport(report))
            );
            return t.batch(functions);
        });
    }


}));