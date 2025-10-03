import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import {
  assertDataCount,
  assertVsDatex2Count,
  dbTestBase,
} from "../db-testutil.js";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { jest } from "@jest/globals";
import { insertData } from "../../dao/data.js";
import { Datex2Version, SOURCES, TYPES } from "../../model/types.js";
import { TEST_DATEX2 } from "../service/datex2_223_files.js";

async function getResponseFromLambda(): Promise<void> {
  const { handler } = await import(
    "../../lambda/handle-variable-signs/handle-variable-signs.js"
  );

  await handler();
}

describe(
  "handle-variable-signs-lambda-test",
  dbTestBase((db: DTDatabase) => {
    jest.spyOn(ProxyHolder.prototype, "setCredentials").mockResolvedValue();

    test("nothing to handle", async () => {
      await getResponseFromLambda();
    });

    test("handle one item", async () => {
      await insertData(
        db,
        "test123",
        SOURCES.API,
        Datex2Version["2.2.3"],
        TYPES.VMS_DATEX2_XML,
        TEST_DATEX2,
      );
      await assertDataCount(db, 1, "NEW");

      await getResponseFromLambda();
      await assertDataCount(db, 1, "PROCESSED");
      await assertVsDatex2Count(db, 2);
    });
  }),
);
