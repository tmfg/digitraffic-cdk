import { dbTestBase, insertDisruption } from "../db-testutil";
import { newDisruption } from "../testdata";
import * as DisruptionsService from "../../lib/service/disruptions";
import * as DisruptionsDb from "../../lib/db/disruptions";
import { DTDatabase } from "@digitraffic/common/dist/database/database";
import { TEST_FEATURE_COLLECTION } from "../testdisruptions";

describe(
    "disruptions",
    dbTestBase((db: DTDatabase) => {
        test("findAllDisruptions", async () => {
            const disruptions = Array.from({
                length: Math.floor(Math.random() * 10)
            }).map(() => {
                return newDisruption();
            });
            await insertDisruption(db, disruptions);

            const [fetchedDisruptions, lastModified] = await DisruptionsService.findAllDisruptions();

            expect(fetchedDisruptions.features.length).toBe(disruptions.length);
            expect(lastModified.getTime()).toBeCloseTo(Date.now(), -4); // max 5 s diff
        });

        test("saveDisruptions - all new", async () => {
            const disruptions = Array.from({
                length: Math.floor(Math.random() * 10)
            }).map(() => {
                return newDisruption();
            });

            await DisruptionsService.saveDisruptions(disruptions);

            const savedDisruptions = await DisruptionsDb.findAll(db);
            expect(savedDisruptions.length).toBe(disruptions.length);
        });

        test("saveDisruptions - remove one old", async () => {
            const disruptions = Array.from({
                length: Math.floor(Math.random() * 10)
            }).map(() => {
                return newDisruption();
            });

            await insertDisruption(db, [newDisruption()]);
            expect((await DisruptionsDb.findAll(db)).length).toBe(1); // one already exists
            await DisruptionsService.saveDisruptions(disruptions);

            const savedDisruptions = await DisruptionsDb.findAll(db);
            expect(savedDisruptions.length).toBe(disruptions.length);
        });

        test("validateGeoJson", () => {
            // single valid feature
            expect(TEST_FEATURE_COLLECTION.features.filter(DisruptionsService.validateGeoJson).length).toBe(
                1
            );
        });

        test("normalizeDisruptionDate", () => {
            const normalized = DisruptionsService.normalizeDisruptionDate("5.4.2020 1:01");

            expect(normalized.getFullYear()).toBe(2020);
            expect(normalized.getMonth() + 1).toBe(4);
            expect(normalized.getDate()).toBe(5);
            expect(normalized.getHours()).toBe(1);
            expect(normalized.getMinutes()).toBe(1);
        });
    })
);
