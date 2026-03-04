import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { describe, test, vi } from "vitest";
import { insertData } from "../../dao/data.js";
import { assertDataCount, dbTestBase } from "../db-testutil.js";

async function getResponseFromLambda(): Promise<void> {
  const { handler } = await import(
    "../../lambda/delete-old-messages/delete-old-messages.js"
  );

  await handler();
}

describe(
  "delete-old-messages-lambda-test",
  dbTestBase((db: DTDatabase) => {
    vi.spyOn(ProxyHolder.prototype, "setCredentials").mockResolvedValue();

    test("delete, no data", async () => {
      await getResponseFromLambda();

      await assertDataCount(db, 0);
    });

    test("delete, not old", async () => {
      await insertData(db, "test1", "TEST", "v1", "TEST", "TEST");
      await getResponseFromLambda();

      await assertDataCount(db, 1);
    });

    test("delete", async () => {
      await insertData(db, "test1", "TEST", "v1", "TEST", "TEST");
      await db.none(
        "update data_incoming set created_at = (current_date - interval '10 days')",
      );
      await getResponseFromLambda();

      await assertDataCount(db, 0);
    });
  }),
);
