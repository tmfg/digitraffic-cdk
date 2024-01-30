import { dbTestBase, insertCounter, insertData, insertDomain, insertLastUpdated } from "../db-testutil.js";
import * as CountingSitesService from "../../service/counting-sites.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { EPOCH } from "@digitraffic/common/dist/utils/date-utils";

describe(
    "counting-sites service tests",
    dbTestBase((db: DTDatabase) => {
        const DOMAIN1 = "DOMAIN1";
        const DOMAIN2 = "DOMAIN2";

        function assertDataLines(csv: string, expected: number): void {
            // every line ends with \n and every csv contains header
            // so empty csv has one line ending -> splits to 2 parts

            expect(csv.split("\n")).toHaveLength(2 + expected);
        }

        test("getDomains - empty", async () => {
            const [domains, lastModified] = await CountingSitesService.getDomains();

            expect(domains).toHaveLength(0);
            expect(lastModified).toEqual(EPOCH);
        });

        test("getDomains - two domains", async () => {
            const now = new Date();
            now.setMilliseconds(0);

            await insertDomain(db, DOMAIN1);
            await insertDomain(db, DOMAIN2);
            await insertCounter(db, 1, DOMAIN1, 1);
            await insertLastUpdated(db, 1, now);

            const [domains, lastModified] = await CountingSitesService.getDomains();

            expect(domains).toHaveLength(2);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            expect(domains[0]!.name).toEqual(DOMAIN1);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            expect(domains[1]!.name).toEqual(DOMAIN2);
            expect(lastModified.getTime()).toBeCloseTo(Date.now(), -4); // max 5 s diff
        });

        test("getUserTypes", async () => {
            const [userTypes, lastModified] = await CountingSitesService.getUserTypes();

            expect(Object.keys(userTypes)).toHaveLength(11);
            expect(lastModified.getTime()).toBeDefined();
        });

        test("findCounter", async () => {
            await insertDomain(db, DOMAIN1);
            await insertCounter(db, 1, DOMAIN1, 1);
            await insertData(db, 1, 15);

            const [counters, lastModified] = await CountingSitesService.findCounters("", 1);

            expect(counters.features).toHaveLength(1);
             // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, dot-notation
            expect(counters.features[0]!.properties?.["id"]).toBe(1);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, dot-notation
            expect(counters.features[0]!.properties?.["interval"]).toBe(15);
            expect(lastModified.getTime()).toBeCloseTo(Date.now(), -4); // max 5 s diff
        });

        test("findCounter - not found", async () => {
            await insertDomain(db, DOMAIN1);
            await insertCounter(db, 1, DOMAIN1, 1);
            await insertData(db, 1, 15);

            const [counters, lastModified] = await CountingSitesService.findCounters("", 2);

            expect(counters.features).toHaveLength(0);
            expect(lastModified).toEqual(EPOCH);
        });

        test("findCounters - not found", async () => {
            await insertDomain(db, DOMAIN1);
            await insertCounter(db, 1, DOMAIN1, 1);

            // no counters
            const [counters, lastModified] = await CountingSitesService.findCounters("not_found");

            expect(counters.features).toHaveLength(0);
            expect(lastModified).toEqual(EPOCH);
        });

        test("findCounters - two domains find one", async () => {
            await insertDomain(db, DOMAIN1);
            await insertDomain(db, DOMAIN2);
            await insertCounter(db, 1, DOMAIN1, 1);
            await insertCounter(db, 2, DOMAIN1, 1);
            await insertCounter(db, 3, DOMAIN2, 1);

            // two counters on domain1
            const [counters1, lastModified1] = await CountingSitesService.findCounters(DOMAIN1);
            expect(counters1.features).toHaveLength(2);
            expect(lastModified1.getTime()).toBeCloseTo(Date.now(), -4); // max 5 s diff

            // one counter on domain2
            const [counters2, lastModified2] = await CountingSitesService.findCounters(DOMAIN2);
            expect(counters2.features).toHaveLength(1);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, dot-notation
            expect((counters2.features[0]!.properties?.["lastDataTimestamp"] as string).toString()).toMatch(
                new RegExp("(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2}):(\\d{2})Z")
            );
            expect(lastModified2.getTime()).toBeCloseTo(Date.now(), -4); // max 5 s diff
        });

        test("findCounters - two domains find both", async () => {
            await insertDomain(db, DOMAIN1);
            await insertDomain(db, DOMAIN2);
            await insertCounter(db, 1, DOMAIN1, 1);
            await insertCounter(db, 2, DOMAIN1, 1);
            await insertCounter(db, 3, DOMAIN2, 1);

            // total 3 counters on all domains
            const [counters, lastModified] = await CountingSitesService.findCounters();
            expect(counters.features).toHaveLength(3);
            expect(lastModified.getTime()).toBeCloseTo(Date.now(), -4); // max 5 s diff
        });

        test("findData - empty", async () => {
            const [data, lastModified] = await CountingSitesService.findCounterValues(2021, 10, "0");

            expect(data).toHaveLength(0);
            expect(lastModified).toEqual(EPOCH);
        });

        test("findData - one value", async () => {
            await insertDomain(db, DOMAIN1);
            await insertCounter(db, 1, DOMAIN1, 1);
            await insertData(db, 1, 15);

            const [data1, lastModified1] = await CountingSitesService.findCounterValues(2021, 10, "2");
            expect(data1).toHaveLength(0);
            expect(lastModified1).toEqual(EPOCH);

            const [data2, lastModified2] = await CountingSitesService.findCounterValues(2021, 10, "1");
            expect(data2).toHaveLength(1);
            expect(lastModified2.getTime()).toBeCloseTo(Date.now(), -4); // max 5 s diff

            const [data3, lastModified3] = await CountingSitesService.findCounterValues(
                2021,
                10,
                "",
                DOMAIN2
            );
            expect(data3).toHaveLength(0);
            expect(lastModified3).toEqual(EPOCH);

            const [data4, lastModified4] = await CountingSitesService.findCounterValues(
                2021,
                10,
                "",
                DOMAIN1
            );
            expect(data4).toHaveLength(1);
            expect(lastModified4.getTime()).toBeCloseTo(Date.now(), -4); // max 5 s diff
        });

        test("getCsvData - empty", async () => {
            const [data, lastModified] = await CountingSitesService.getValuesForMonth(2021, 10, "", "");

            assertDataLines(data, 0);
            expect(lastModified).toEqual(EPOCH);
        });

        test("getCsvData - one value", async () => {
            // inserted data is 31.10.2021
            await insertDomain(db, DOMAIN1);
            await insertCounter(db, 1, DOMAIN1, 1);
            await insertData(db, 1, 15);

            const [data1, lastModified1] = await CountingSitesService.getValuesForMonth(2021, 9, "", "");
            assertDataLines(data1, 0);
            expect(lastModified1).toEqual(EPOCH);

            const [data2, lastModified2] = await CountingSitesService.getValuesForMonth(2021, 10, "", "");
            assertDataLines(data2, 1);
            expect(lastModified2.getTime()).toBeCloseTo(Date.now(), -4); // max 5 s diff

            const [data3, lastModified3] = await CountingSitesService.getValuesForMonth(
                2021,
                10,
                DOMAIN2,
                ""
            );
            assertDataLines(data3, 0);
            expect(lastModified3).toEqual(EPOCH);

            const [data4, lastModified4] = await CountingSitesService.getValuesForMonth(
                2021,
                10,
                DOMAIN1,
                ""
            );
            assertDataLines(data4, 1);
            expect(lastModified4.getTime()).toBeCloseTo(Date.now(), -4); // max 5 s diff
        });
    })
);
