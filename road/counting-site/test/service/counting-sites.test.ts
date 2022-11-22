import {
    dbTestBase,
    insertCounter,
    insertData,
    insertDomain,
    insertLastUpdated,
} from "../db-testutil";
import * as CountingSitesService from "../../lib/service/counting-sites";
import { DTDatabase } from "@digitraffic/common/dist/database/database";

describe(
    "counting-sites service tests",
    dbTestBase((db: DTDatabase) => {
        const DOMAIN1 = "DOMAIN1";
        const DOMAIN2 = "DOMAIN2";

        function assertDataLines(csv: string, expected: number) {
            // every line ends with \n and every csv contains header
            // so empty csv has one line ending -> splits to 2 parts

            expect(csv.split("\n")).toHaveLength(2 + expected);
        }

        test("getDomains - empty", async () => {
            const domains = await CountingSitesService.getDomains();

            expect(domains).toHaveLength(0);
        });

        test("getDomains - two domains", async () => {
            const now = new Date();
            now.setMilliseconds(0);

            await insertDomain(db, DOMAIN1);
            await insertDomain(db, DOMAIN2);
            await insertCounter(db, 1, DOMAIN1, 1);
            await insertLastUpdated(db, 1, now);

            const domains = await CountingSitesService.getDomains();

            expect(domains).toHaveLength(2);
            expect(domains[0].name).toEqual(DOMAIN1);
            expect(domains[1].name).toEqual(DOMAIN2);
        });

        test("getUserTypes", async () => {
            const userTypes = await CountingSitesService.getUserTypes();

            expect(Object.keys(userTypes)).toHaveLength(11);
        });

        test("findCounters - not found", async () => {
            await insertDomain(db, DOMAIN1);
            await insertCounter(db, 1, DOMAIN1, 1);

            // no counters
            const counters = await CountingSitesService.findCounters(
                "not_found"
            );

            expect(counters.features).toHaveLength(0);
        });

        test("findCounters - two domains find one", async () => {
            await insertDomain(db, DOMAIN1);
            await insertDomain(db, DOMAIN2);
            await insertCounter(db, 1, DOMAIN1, 1);
            await insertCounter(db, 2, DOMAIN1, 1);
            await insertCounter(db, 3, DOMAIN2, 1);

            // two counters on domain1
            const counters1 = await CountingSitesService.findCounters(DOMAIN1);
            expect(counters1.features).toHaveLength(2);

            // one counter on domain2
            const counters2 = await CountingSitesService.findCounters(DOMAIN2);
            expect(counters2.features).toHaveLength(1);
        });

        test("findCounters - two domains find both", async () => {
            await insertDomain(db, DOMAIN1);
            await insertDomain(db, DOMAIN2);
            await insertCounter(db, 1, DOMAIN1, 1);
            await insertCounter(db, 2, DOMAIN1, 1);
            await insertCounter(db, 3, DOMAIN2, 1);

            // total 3 counters on all domains
            const counters = await CountingSitesService.findCounters();
            expect(counters.features).toHaveLength(3);
        });

        test("findData - empty", async () => {
            const data = await CountingSitesService.findCounterValues(
                2021,
                10,
                "0"
            );

            expect(data).toHaveLength(0);
        });

        test("findData - one value", async () => {
            await insertDomain(db, DOMAIN1);
            await insertCounter(db, 1, DOMAIN1, 1);
            await insertData(db, 1, 15);

            const data1 = await CountingSitesService.findCounterValues(
                2021,
                10,
                "2"
            );
            expect(data1).toHaveLength(0);

            const data2 = await CountingSitesService.findCounterValues(
                2021,
                10,
                "1"
            );
            expect(data2).toHaveLength(1);

            const data3 = await CountingSitesService.findCounterValues(
                2021,
                10,
                "",
                DOMAIN2
            );
            expect(data3).toHaveLength(0);

            const data4 = await CountingSitesService.findCounterValues(
                2021,
                10,
                "",
                DOMAIN1
            );
            expect(data4).toHaveLength(1);
        });

        test("getCsvData - empty", async () => {
            const data = await CountingSitesService.getValuesForMonth(
                2021,
                10,
                "",
                ""
            );

            assertDataLines(data, 0);
        });

        test("getCsvData - one value", async () => {
            // inserted data is 31.10.2021
            await insertDomain(db, DOMAIN1);
            await insertCounter(db, 1, DOMAIN1, 1);
            await insertData(db, 1, 15);

            const data1 = await CountingSitesService.getValuesForMonth(
                2021,
                9,
                "",
                ""
            );
            assertDataLines(data1, 0);

            const data2 = await CountingSitesService.getValuesForMonth(
                2021,
                10,
                "",
                ""
            );
            assertDataLines(data2, 1);

            const data3 = await CountingSitesService.getValuesForMonth(
                2021,
                10,
                DOMAIN2,
                ""
            );
            assertDataLines(data3, 0);

            const data4 = await CountingSitesService.getValuesForMonth(
                2021,
                10,
                DOMAIN1,
                ""
            );
            assertDataLines(data4, 1);
        });
    })
);
