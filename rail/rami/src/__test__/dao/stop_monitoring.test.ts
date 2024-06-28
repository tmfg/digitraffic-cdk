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

        test("insertOrUpdate - one", async () => {
            await expectStopMonitoringRows(0);

            await inTransaction(async conn => {
                await insertOrUpdate(conn, [{
                    trainNumber: 10,
                    trainDepartureDate: "2024-10-10",
                    attapId: 1234,
                    uq: false,
                    ut: false
                }]);
            });

            await expectStopMonitoringRows(1);
        });      

        test("insertOrUpdate - two", async () => {
            await expectStopMonitoringRows(0);

            await inTransaction(async conn => {
                await insertOrUpdate(conn, [{
                    trainNumber: 10,
                    trainDepartureDate: "2024-10-10",
                    attapId: 1234,
                    uq: false,
                    ut: false
                }, {
                    trainNumber: 20,
                    trainDepartureDate: "2024-10-10",
                    attapId: 1234,
                    uq: false,
                    ut: false
                }]);
            });

            await expectStopMonitoringRows(2);
        });      
    })
);
