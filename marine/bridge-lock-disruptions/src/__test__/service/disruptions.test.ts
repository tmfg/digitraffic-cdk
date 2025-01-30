import { dbTestBase } from "../db-testutil.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { TEST_FEATURE_COLLECTION } from "../testdisruptions.js";
import { DisruptionsTestDriver } from "./disruptions.test.driver.js";
import {
  normalizeDisruptionDate,
  validateGeoJson,
} from "../../service/disruptions.js";

describe(
  "disruptions",
  dbTestBase((db: DTDatabase) => {
    let driver: DisruptionsTestDriver;

    beforeAll(async () => {
      const setupDriver = new DisruptionsTestDriver(db);
      await setupDriver.saveSeedData();
    });

    beforeEach(() => {
      driver = new DisruptionsTestDriver(db);
    });

    test("findAllDisruptions", async () => {
      await driver.saveAndAssertDisruptions(
        DisruptionsTestDriver.createRandomDisruptions(),
      );
      await driver.assertTimestampsCheckedAndUpdated();
    });

    test("saveDisruptions - empty - no changes", async () => {
      await driver.saveAndAssertDisruptions([]);
      await driver.assertTimestampsCheckedNotUpdated();
    });

    test("saveDisruptions - remove one old and add new ones", async () => {
      await driver.saveAndAssertDisruptions(
        DisruptionsTestDriver.createRandomDisruptions(1),
      );
      await driver.saveAndAssertDisruptions(
        DisruptionsTestDriver.createRandomDisruptions(5),
      );
      await driver.assertTimestampsCheckedAndUpdated();
    });

    test("saveDisruptions - remove old ones", async () => {
      await driver.saveAndAssertDisruptions(
        DisruptionsTestDriver.createRandomDisruptions(),
      );
      await driver.saveAndAssertDisruptions([]);
      await driver.assertTimestampsCheckedAndUpdated();
    });

    test("saveDisruptions - update one with same data", async () => {
      await driver.saveAndAssertDisruptions(
        DisruptionsTestDriver.createRandomDisruptions(1),
      );
      await driver.saveAndAssertDisruptions(driver.lastDisruptions);
      await driver.assertTimestampsCheckedNotUpdated();
    });

    test("saveDisruptions - update multiple with same data", async () => {
      await driver.saveAndAssertDisruptions(
        DisruptionsTestDriver.createRandomDisruptions(3),
      );
      await driver.saveAndAssertDisruptions(driver.lastDisruptions);
      await driver.assertTimestampsCheckedNotUpdated();
    });

    test("validateGeoJson", () => {
      // single valid feature
      expect(TEST_FEATURE_COLLECTION.features.filter(validateGeoJson).length)
        .toBe(1);
    });

    test("normalizeDisruptionDate", () => {
      const normalized = normalizeDisruptionDate("5.4.2020 1:01");

      expect(normalized.getFullYear()).toBe(2020);
      expect(normalized.getMonth() + 1).toBe(4);
      expect(normalized.getDate()).toBe(5);
      expect(normalized.getHours()).toBe(1);
      expect(normalized.getMinutes()).toBe(1);
    });
  }),
);
