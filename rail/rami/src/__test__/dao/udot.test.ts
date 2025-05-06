import { dbTestBase, expectRowCount } from "../db-testutil.js";
import { inTransaction } from "../../util/database.js";
import { insertOrUpdate } from "../../dao/udot.js";
import { randomString } from "@digitraffic/common/dist/test/testutils";

describe(
  "UdotDaoTests",
  dbTestBase(() => {
    async function expectStopMonitoringRows(
      expectedCount: number,
    ): Promise<void> {
      await expectRowCount(expectedCount, "select count(*) from rami_udot");
    }

    async function insertStopMonitoring(
      ud: boolean,
      ut: boolean,
      trainNumber: number = 10,
    ): Promise<void> {
      await inTransaction(async (conn) => {
        await insertOrUpdate(conn, {
          trainNumber,
          trainDepartureDate: "2024-10-10",
          attapId: 1234,
          ud,
          ut,
          messageId: "id_" + randomString(),
        });
      });
    }

    async function modelUpdated(): Promise<void> {
      await inTransaction(async (conn) => {
        await conn.execute(
          "update rami_udot set model_updated_time = current_timestamp",
        );
      });
    }

    async function expectModelUpdatedCount(
      expectedCount: number,
    ): Promise<void> {
      await expectRowCount(
        expectedCount,
        "select count(*) from rami_udot where model_updated_time is not null",
      );
    }

    test("insertOrUpdate - insert falses", async () => {
      await insertStopMonitoring(false, false);
      await expectStopMonitoringRows(0);
    });

    test("insertOrUpdate - insert trues", async () => {
      await insertStopMonitoring(true, true);
      await expectStopMonitoringRows(1);
    });

    test("insertOrUpdate - two", async () => {
      await insertStopMonitoring(true, false, 10);
      await insertStopMonitoring(false, true, 20);
      await expectStopMonitoringRows(2);
    });

    test("insertOrUpdate - update row", async () => {
      await insertStopMonitoring(true, false);
      await expectStopMonitoringRows(1);

      // update existing row
      await insertStopMonitoring(false, false);
      await expectStopMonitoringRows(1);
    });

    test("update removes modified", async () => {
      await insertStopMonitoring(true, false);
      await expectModelUpdatedCount(0);

      await modelUpdated();
      await expectModelUpdatedCount(1);

      // update row, model updated should be cleared
      await insertStopMonitoring(false, false);
      await expectModelUpdatedCount(0);
    });

    test("update without changes does not remove modified", async () => {
      await insertStopMonitoring(true, false);
      await expectModelUpdatedCount(0);

      await modelUpdated();
      await expectModelUpdatedCount(1);

      // update row with same values, model updated should NOT be cleared
      await insertStopMonitoring(true, false);
      await expectModelUpdatedCount(1);
    });
  }),
);
