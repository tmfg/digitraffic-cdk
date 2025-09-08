import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import {
  assertDataCount,
  assertVsDatex2Count,
  dbTestBase,
} from "../db-testutil.js";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { jest } from "@jest/globals";
import { insertData } from "../../dao/data.js";
import { SOURCES, TYPES } from "../../model/types.js";

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
        "v1",
        TYPES.VS_DATEX2_XML,
        "testdata",
      );
      await assertDataCount(db, 1, "NEW");

      await getResponseFromLambda();
      await assertDataCount(db, 1, "PROCESSED");
      await assertVsDatex2Count(db, 1);
    });
  }),
);
