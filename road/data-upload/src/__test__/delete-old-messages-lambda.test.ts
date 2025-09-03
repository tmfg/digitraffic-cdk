import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import { assertD2Count, dbTestBase } from "./db-testutil.js";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { jest } from "@jest/globals";
import { insertDatex2 } from "../dao/data.js";

async function getResponseFromLambda(): Promise<void> {
  const { handler } = await import(
    "../lambda/delete-old-messages/delete-old-messages.js"
  );

  await handler();
}

describe(
  "delete-old-messages-test",
  dbTestBase((db: DTDatabase) => {
    jest.spyOn(ProxyHolder.prototype, "setCredentials").mockResolvedValue();
    //        jest.spyOn(SecretHolder.prototype, "get").mockResolvedValue({});

    test("delete, no data", async () => {
      await getResponseFromLambda();

      await assertD2Count(db, 0);
    });

    test("delete, not old", async () => {
      await insertDatex2(db, "test1", "TEST", "v1", "TEST", "TEST");
      await getResponseFromLambda();

      await assertD2Count(db, 1);
    });

    test("delete", async () => {
      await insertDatex2(db, "test1", "TEST", "v1", "TEST", "TEST");
      await db.none(
        "update data_incoming set created_at = (current_date - interval '10 days')",
      );
      await getResponseFromLambda();

      await assertD2Count(db, 0);
    });
  }),
);
