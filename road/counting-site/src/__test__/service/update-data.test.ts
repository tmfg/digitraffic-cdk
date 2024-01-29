import { EcoCounterApi } from "../../api/eco-counter.js";
import { updateDataForDomain } from "../../service/update.js";
import { dbTestBase, insertCounter, insertDomain } from "../db-testutil.js";
import * as DataDAO from "../../dao/data.js";

import type { ApiData } from "../../model/data.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { jest } from "@jest/globals";

const DOMAIN_NAME = "TEST_DOMAIN";

describe(
    "update tests",
    dbTestBase((db: DTDatabase) => {
        const EMPTY_DATA: ApiData[] = [];

        function mockApiResponse(response: ApiData[]) {
            return jest.spyOn(EcoCounterApi.prototype, "getDataForSite").mockResolvedValue(response);
        }

        async function assertDataInDb(expected: number, counterId: string): Promise<void> {
            const [data, lastModified] = await DataDAO.findValues(db, 2015, 9, counterId, "");
            expect(data).toHaveLength(expected);
            expect(lastModified).toBeDefined();
        }

        test("updateDataForDomain - no counters", async () => {
            await insertDomain(db, DOMAIN_NAME);
            const counterApiResponse = mockApiResponse(EMPTY_DATA);

            await updateDataForDomain(DOMAIN_NAME, "", "");

            expect(counterApiResponse).not.toHaveBeenCalled();
        });

        test("updateDataForDomain - one counter no data", async () => {
            await insertDomain(db, DOMAIN_NAME);
            await insertCounter(db, 1, DOMAIN_NAME, 1);
            const counterApiResponse = mockApiResponse(EMPTY_DATA);

            await updateDataForDomain(DOMAIN_NAME, "", "");

            expect(counterApiResponse).toHaveBeenCalled();
        });

        const RESPONSE_DATA: ApiData[] = [
            {
                date: "2015-09-25T05:00:00+0000",
                isoDate: new Date("2015-09-25T05:00:00+0200"),
                counts: 1,
                status: 1
            }
        ];

        test("updateDataForDomain - one counter and data", async () => {
            await insertDomain(db, DOMAIN_NAME);
            await insertCounter(db, 1, DOMAIN_NAME, 1);
            const counterApiResponse = mockApiResponse(RESPONSE_DATA);

            await updateDataForDomain(DOMAIN_NAME, "", "");

            await assertDataInDb(1, "1");
            expect(counterApiResponse).toHaveBeenCalled();
        });

        test("updateDataForDomain - one counter and data, last update week ago", async () => {
            await insertDomain(db, DOMAIN_NAME);
            await insertCounter(db, 1, DOMAIN_NAME, 1);
            await db.any("update counting_site_counter set last_data_timestamp=now() - interval '7 days'");
            const counterApiResponse = mockApiResponse(RESPONSE_DATA);

            await updateDataForDomain(DOMAIN_NAME, "", "");

            await assertDataInDb(1, "1");
            expect(counterApiResponse).toHaveBeenCalled();
        });

        test("updateDataForDomain - one counter and data - no need to update", async () => {
            await insertDomain(db, DOMAIN_NAME);
            await insertCounter(db, 1, DOMAIN_NAME, 1);
            await db.any("update counting_site_counter set last_data_timestamp=now()");
            const counterApiResponse = mockApiResponse(RESPONSE_DATA);

            await updateDataForDomain(DOMAIN_NAME, "", "");

            // timestamp said the data was just updated, so no new data was added
            await assertDataInDb(0, "1");
            expect(counterApiResponse).not.toHaveBeenCalled();
        });
    })
);
