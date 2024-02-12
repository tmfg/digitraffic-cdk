import { updateMetadataForDomain } from "../../service/update.js";
import { dbTestBase, insertCounter, insertDomain } from "../db-testutil.js";
import * as CounterDAO from "../../dao/counter.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import type { DbCounter } from "../../model/counter.js";
import { jest } from "@jest/globals";
import axios from "axios";

const DOMAIN_NAME = "TEST_DOMAIN";

describe(
    "update tests",
    dbTestBase((db: DTDatabase) => {
        const EMPTY_DATA = {
            status: 200,
            data: []
        };

        async function assertCountersInDb(
            domain: string,
            expected: number,
            fn?: (x: DbCounter[]) => void
        ): Promise<void> {
            const counters = await CounterDAO.findAllCountersForUpdateForDomain(db, domain);
            expect(counters).toHaveLength(expected);

            if (fn) {
                fn(counters);
            }
        }

        test("updateMetadataForDomain - empty", async () => {
            await assertCountersInDb(DOMAIN_NAME, 0);
            await insertDomain(db, DOMAIN_NAME);

            const server = jest.spyOn(axios, "get").mockResolvedValue(EMPTY_DATA);

            await updateMetadataForDomain(DOMAIN_NAME, "", "");

            expect(server).toHaveBeenCalled();

            await assertCountersInDb(DOMAIN_NAME, 0);
        });

        const RESPONSE_ONE_COUNTER = {
            status: 200,
            data: [
                {
                    name: "DOMAINNAME",
                    channels: [
                        {
                            id: 1,
                            domain: "D",
                            name: "COUNTERNAME",
                            latitude: 10,
                            longitude: 10,
                            userType: 1,
                            interval: 15,
                            sens: 1
                        }
                    ]
                }
            ]
        };

        test("updateMetadataForDomain - insert", async () => {
            await insertDomain(db, DOMAIN_NAME);
            await assertCountersInDb(DOMAIN_NAME, 0);

            const server = jest.spyOn(axios, "get").mockResolvedValue(RESPONSE_ONE_COUNTER);

            await updateMetadataForDomain(DOMAIN_NAME, "", "");

            expect(server).toHaveBeenCalled();

            await assertCountersInDb(DOMAIN_NAME, 1, (counters: DbCounter[]) => {
                expect(counters[0]!.name).toEqual("DOMAINNAME COUNTERNAME");
            });

            await assertCountersInDb("WRONG", 0);
        });

        test("updateMetadataForDomain - update", async () => {
            await insertDomain(db, DOMAIN_NAME);
            await insertCounter(db, 1, DOMAIN_NAME, 1);
            await assertCountersInDb(DOMAIN_NAME, 1);

            const server = jest.spyOn(axios, "get").mockResolvedValue(RESPONSE_ONE_COUNTER);

            await updateMetadataForDomain(DOMAIN_NAME, "", "");

            expect(server).toHaveBeenCalled();
            await assertCountersInDb(DOMAIN_NAME, 1);
        });

        test("updateMetadataForDomain - remove", async () => {
            await insertDomain(db, DOMAIN_NAME);
            await insertCounter(db, 1, DOMAIN_NAME, 1);
            await assertCountersInDb(DOMAIN_NAME, 1);

            const server = jest.spyOn(axios, "get").mockResolvedValue(EMPTY_DATA);

            await updateMetadataForDomain(DOMAIN_NAME, "", "");

            expect(server).toHaveBeenCalled();

            await assertCountersInDb(DOMAIN_NAME, 1, (counters: DbCounter[]) => {
                expect(counters[0]!.removed_timestamp).not.toBeNull();
            });
        });
    })
);
