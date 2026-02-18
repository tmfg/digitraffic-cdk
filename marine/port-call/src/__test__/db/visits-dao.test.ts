import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import * as VisitsDAO from "../../db/visits.js";
import { assertVisitCount, dbTestBase } from "../db-testutil.js";
import { createTestVisit } from "../testdata.js";

describe(
  "visits-dao-tests",
  dbTestBase((db: DTDatabase) => {
    test("no visits", async () => {
      const visits = await VisitsDAO.findAllVisits(db, undefined, undefined);
      expect(visits.length).toBe(0);

      await assertVisitCount(db, 0);
    });

    test("insert one", async () => {
      const update = await VisitsDAO.upsertVisit(db, createTestVisit());
      expect(update.inserted).toBe(1);
      expect(update.updated).toBe(0);

      await assertVisitCount(db, 1);
    });
  }),
);
