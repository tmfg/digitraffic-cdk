import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import {
  dbTestBase,
  getDomain,
  insertDomain,
  truncate,
} from "../db-testutil.js";
import { DOMAIN_1 } from "../testconstants.js";

describe(
  "common-update-service-test",
  dbTestBase((db: DTDatabase) => {
    afterEach(async () => {
      await truncate(db);
    });

    test("upsertDomain", async () => {
      await insertDomain(db, DOMAIN_1);
      const domain = await getDomain(db, DOMAIN_1);
      expect(domain.name).toEqual(DOMAIN_1);
      expect(domain.source).toBeNull();
    });
  }),
);
