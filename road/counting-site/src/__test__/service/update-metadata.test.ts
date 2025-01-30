import { dbTestBase } from "../db-testutil.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { jest } from "@jest/globals";
import ky from "ky";
import { mockKyResponse } from "@digitraffic/common/dist/test/mock-ky";
import type { DbSite } from "../../model/v2/db-model.js";
import { getAllSites } from "../../dao/site.js";
import { updateMetadata } from "../../service/update-service.js";
import { insertSite, TEST_SITE_1 } from "../lambda/get-sites.test.js";

describe(
  "update tests",
  dbTestBase((db: DTDatabase) => {
    async function assertSitesInDb(
      totalCount: number,
      deletedCount: number = 0,
      fn?: (x: DbSite[]) => void,
    ): Promise<void> {
      const sites = await getAllSites(db);
      const deleted = sites.filter((s) => s.removed_timestamp);

      expect(sites).toHaveLength(totalCount);
      expect(deleted).toHaveLength(deletedCount);

      if (fn) {
        fn(sites);
      }
    }

    test("updateMetadata - empty", async () => {
      await assertSitesInDb(0);

      const server = jest.spyOn(ky, "get").mockImplementation(() =>
        mockKyResponse(200, JSON.stringify([]))
      );
      await updateMetadata("", "", "Fintraffic");
      expect(server).toHaveBeenCalled();

      await assertSitesInDb(0);
    });

    test("updateMetadata - insert", async () => {
      await assertSitesInDb(0);

      const server = jest.spyOn(ky, "get").mockImplementation(() =>
        mockKyResponse(200, JSON.stringify([TEST_SITE_1]))
      );
      await updateMetadata("", "", "Fintraffic");
      expect(server).toHaveBeenCalled();

      await assertSitesInDb(1, 0, (sites: DbSite[]) => {
        expect(sites[0]!.name).toEqual(TEST_SITE_1.name);
      });
    });

    test("updateMetadata - update", async () => {
      await insertSite(db);
      await assertSitesInDb(1);

      const server = jest.spyOn(ky, "get").mockImplementation(() =>
        mockKyResponse(200, JSON.stringify([TEST_SITE_1]))
      );
      await updateMetadata("", "", "Fintraffic");

      expect(server).toHaveBeenCalled();
      await assertSitesInDb(1);
    });

    test("updateMetadata - remove", async () => {
      await insertSite(db);
      await assertSitesInDb(1);

      const server = jest.spyOn(ky, "get").mockImplementation(() =>
        mockKyResponse(200, JSON.stringify([]))
      );
      await updateMetadata("", "", "Fintraffic");

      expect(server).toHaveBeenCalled();
      await assertSitesInDb(1, 1);
    });
  }),
);
