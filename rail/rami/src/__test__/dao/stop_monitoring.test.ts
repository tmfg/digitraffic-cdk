import { dbTestBase } from "../db-testutil.js";
import { insertOrUpdate } from "../../dao/stop_monitoring.js";
import { inTransaction } from "../../util/database.js";
import _ from "lodash";

describe("StopMonitoringDao", dbTestBase(() => {
    async function expectStopMonitoringRows(expectedCount: number): Promise<void> {
        await inTransaction(async conn => {
            const [rows] = await conn.query("select count(*) from stop_monitoring");
            expect(rows).toHaveLength(1);
            expect(_.get(rows, ["0", "count(*)"])).toEqual(expectedCount);
        });
    }

    async function insertStopMonitoring(ud: boolean, ut: boolean, trainNumber: number = 10): Promise<void> {
        await inTransaction(async conn => {
            await insertOrUpdate(conn, [{
                trainNumber,
                trainDepartureDate: "2024-10-10",
                attapId: 1234,
                ud, ut,
                messageId: "id"
            }]);
        });
    }

        test("insertOrUpdate - insert falses", async () => {
            await expectStopMonitoringRows(0);

            await insertStopMonitoring(false, false);

            await expectStopMonitoringRows(0);
        });      

        test("insertOrUpdate - insert trues", async () => {
            await expectStopMonitoringRows(0);

            await insertStopMonitoring(true, true);

            await expectStopMonitoringRows(1);
        });      

        test("insertOrUpdate - two", async () => {
            await expectStopMonitoringRows(0);

            await insertStopMonitoring(true, false, 10);
            await insertStopMonitoring(false, true, 20);        

            await expectStopMonitoringRows(2);
        });      

        test("insertOrUpdate - update row", async () => {
            await expectStopMonitoringRows(0);

            await insertStopMonitoring(true, false);

            await expectStopMonitoringRows(1);

            await insertStopMonitoring(false, false);

            await expectStopMonitoringRows(1);
        });      

    })
);
