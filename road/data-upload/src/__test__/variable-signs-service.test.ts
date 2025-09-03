import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { assertDataCount, dbTestBase } from "./db-testutil.js";
import { handleVariableSignMessages } from "../service/variable-signs.js";
import { insertData } from "../dao/data.js";
import { SOURCES, TYPES } from "../model/types.js";

describe(
  "variable-signs-service-test",
  dbTestBase((db: DTDatabase) => {
    test("nothing to handle", async () => {
      await handleVariableSignMessages();
      await assertDataCount(db, 0);
    });

    test("handle one", async () => {
      await insertData(
        db,
        "test1",
        SOURCES.API,
        "test",
        TYPES.VS,
        "test_data_1",
      );
      await assertDataCount(db, 1, "NEW");

      await handleVariableSignMessages();
      await assertDataCount(db, 1, "PROCESSED");
    });
  }),
);
