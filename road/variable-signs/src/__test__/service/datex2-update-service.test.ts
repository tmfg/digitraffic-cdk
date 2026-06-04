import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { describe, expect, test } from "vitest";
import { StatusCodeValues } from "../../model/status-code-value.js";
import { updateDatex2 } from "../../service/datex2-update-service.js";
import { assertDatex2Count, dbTestBase, insertDevice } from "../db-testutil.js";
import { TEST_DATEX2, TEST_DATEX2_2 } from "./service-test-constants.js";

describe(
  "datex2-update-service-tests",
  dbTestBase((db: DTDatabase) => {
    test("updateDatex2 - invalid: missing xml tag", async () => {
      const result = await updateDatex2("not xml");

      expect(result).toEqual(StatusCodeValues.BAD_REQUEST);
      await assertDatex2Count(db, 0);
    });

    test("updateDatex2 - invalid: missing payloadPublication", async () => {
      const result = await updateDatex2("<?xml version='1.0'?><root></root>");

      expect(result).toEqual(StatusCodeValues.BAD_REQUEST);
      await assertDatex2Count(db, 0);
    });

    test("updateDatex2 - saves multiple situations sequentially", async () => {
      // TEST_DATEX2 contains situations KRM043951 and KRM044051
      await insertDevice(db, "KRM043951");
      await insertDevice(db, "KRM044051");

      const result = await updateDatex2(TEST_DATEX2);

      expect(result).toEqual(StatusCodeValues.OK);
      await assertDatex2Count(db, 2);
    });

    test("updateDatex2 - upserts on second call", async () => {
      await insertDevice(db, "KRM01");
      await insertDevice(db, "KRM02");

      await updateDatex2(TEST_DATEX2_2);
      await assertDatex2Count(db, 2);

      // call again — should upsert, not insert new rows
      await updateDatex2(TEST_DATEX2_2);
      await assertDatex2Count(db, 2);
    });
  }),
);
