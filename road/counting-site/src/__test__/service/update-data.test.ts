//import type { ApiData } from "../../model/v1/data.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { mockKyResponse } from "@digitraffic/common/dist/test/mock-ky";
import { jest } from "@jest/globals";
import ky from "ky";
import * as DataDAO from "../../dao/data.js";
import type { ApiData } from "../../model/v2/api-model.js";
import { updateData } from "../../service/update-service.js";
import { dbTestBase } from "../db-testutil.js";
import { insertSite } from "../lambda/get-sites.test.js";

describe(
  "update tests",
  dbTestBase((db: DTDatabase) => {
    const EMPTY_DATA: ApiData[] = [];

    async function assertDataInDb(
      expected: number,
      siteId: number,
    ): Promise<void> {
      const [data, lastModified] = await DataDAO.findValuesForDate(
        db,
        new Date(),
        siteId,
      );
      expect(data).toHaveLength(expected);
      expect(lastModified).toBeDefined();
    }

    test("updateDataForDomain - no data", async () => {
      await insertSite(db);

      const server = jest
        .spyOn(ky, "get")
        .mockImplementation(() =>
          mockKyResponse(200, JSON.stringify(EMPTY_DATA)),
        );
      await updateData("", "", "Fintraffic");

      expect(server).toHaveBeenCalled();
      await assertDataInDb(0, 0);
    });

    const RESPONSE_DATA: ApiData[] = [
      {
        travelMode: "bike",
        direction: "in",
        data: [
          {
            timestamp: new Date(),
            granularity: "P1D",
            counts: 1,
          },
          {
            timestamp: new Date(),
            granularity: "P1M",
            counts: 2,
          },
        ],
      },
      {
        travelMode: "car",
        direction: "in",
        data: [
          {
            timestamp: new Date(),
            granularity: "P1D",
            counts: 2,
          },
        ],
      },
    ];

    test("updateDataForDomain - two counter and data", async () => {
      await insertSite(db);

      const server = jest
        .spyOn(ky, "get")
        .mockImplementation(() =>
          mockKyResponse(200, JSON.stringify(RESPONSE_DATA)),
        );
      await updateData("", "", "Fintraffic");

      expect(server).toHaveBeenCalled();
      await assertDataInDb(3, 1);
    });
    /*
        test("updateDataForDomain - one counter and data, last update week ago", async () => {
            await insertDomain(db, DOMAIN_NAME);
            await insertCounter(db, 1, DOMAIN_NAME, 1);
            await db.any("update counting_site_counter set last_data_timestamp=now() - interval '7 days'");
            const counterApiResponse = jest.spyOn(EcoCounterApi.prototype, "getDataForSite").mockResolvedValue(RESPONSE_DATA);

            await updateDataForDomain(DOMAIN_NAME, "", "");

            await assertDataInDb(1, 1);
            expect(counterApiResponse).toHaveBeenCalled();
        });

        test("updateDataForDomain - one counter and data - no need to update", async () => {
            await insertDomain(db, DOMAIN_NAME);
            await insertCounter(db, 1, DOMAIN_NAME, 1);
            await db.any("update counting_site_counter set last_data_timestamp=now()");
            const counterApiResponse = jest.spyOn(EcoCounterApi.prototype, "getDataForSite").mockResolvedValue(RESPONSE_DATA);

            await updateDataForDomain(DOMAIN_NAME, "", "");

            // timestamp said the data was just updated, so no new data was added
            await assertDataInDb(0, 1);
            expect(counterApiResponse).not.toHaveBeenCalled();
        });*/
  }),
);
