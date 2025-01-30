import {
  dbTestBase,
  insertActiveWarnings,
  insertArchivedWarnings,
} from "../db-testutil.js";
import {
  convertDate,
  DATE_FORMAT_1,
  DATE_FORMAT_2,
  DATETIME_FORMAT_1,
  DATETIME_FORMAT_2,
  getActiveWarnings,
  getArchivedWarnings,
  updateNauticalWarnings,
} from "../../service/nautical-warnings.js";

import { NauticalWarningsApi } from "../../api/nautical-warnings.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { isFeatureCollection } from "@digitraffic/common/dist/utils/geometry";
import { EPOCH } from "@digitraffic/common/dist/utils/date-utils";
import {
  TEST_ACTIVE_WARNINGS_VALID,
  TEST_WARNINGS_EMPTY_VALID,
} from "./nautical-warnings-test-constants.js";
import { jest } from "@jest/globals";

describe(
  "nautical-warnings",
  dbTestBase((db: DTDatabase) => {
    test("getActiveWarnings - empty db", async () => {
      const [warnings, lastModified] = await getActiveWarnings();
      expect(warnings).toEqual({
        ...TEST_WARNINGS_EMPTY_VALID,
        ...{ dataUpdatedTime: lastModified.toISOString() },
      });
      expect(lastModified.getTime()).toBeCloseTo(EPOCH.getTime(), -4); // max 5 s diff
    });

    test("getActiveWarnings - value", async () => {
      await insertActiveWarnings(db, TEST_ACTIVE_WARNINGS_VALID);
      const [warnings, lastModified] = await getActiveWarnings();
      expect(warnings).toEqual({
        ...TEST_ACTIVE_WARNINGS_VALID,
        ...{ dataUpdatedTime: lastModified.toISOString() },
      });
      expect(lastModified.getTime()).toBeCloseTo(Date.now(), -4); // max 5 s diff
    });

    test("getArchivedWarnings - empty db", async () => {
      const [warnings, lastModified] = await getArchivedWarnings();
      expect(warnings).toEqual({
        ...TEST_WARNINGS_EMPTY_VALID,
        ...{ dataUpdatedTime: lastModified.toISOString() },
      });
      expect(lastModified.getTime()).toBeCloseTo(EPOCH.getTime(), -4); // max 5 s diff
    });

    test("getArchivedWarnings - value", async () => {
      await insertArchivedWarnings(db, TEST_WARNINGS_EMPTY_VALID);
      const [warnings, lastModified] = await getArchivedWarnings();
      expect(warnings).toEqual({
        ...TEST_WARNINGS_EMPTY_VALID,
        ...{ dataUpdatedTime: lastModified.toISOString() },
      });
      expect(lastModified.getTime()).toBeCloseTo(Date.now(), -4); // max 5 s diff
    });

    test("updateNauticalWarnings - valid geojson", async () => {
      jest.spyOn(NauticalWarningsApi.prototype, "getActiveWarnings")
        .mockResolvedValue(TEST_ACTIVE_WARNINGS_VALID);
      jest.spyOn(NauticalWarningsApi.prototype, "getArchivedWarnings")
        .mockResolvedValue(TEST_WARNINGS_EMPTY_VALID);

      await updateNauticalWarnings("any");

      const [active, activeLastModified] = await getActiveWarnings();
      expect(isFeatureCollection(active));
      expect(active).toEqual({
        ...TEST_ACTIVE_WARNINGS_VALID,
        ...{ dataUpdatedTime: activeLastModified.toISOString() },
      });
      expect(activeLastModified.getTime()).toBeCloseTo(Date.now(), -4); // max 5 s diff

      const [archived, archivedLastModified] = await getArchivedWarnings();
      expect(archived).toEqual({
        ...TEST_WARNINGS_EMPTY_VALID,
        ...{ dataUpdatedTime: archivedLastModified.toISOString() },
      });
      expect(archivedLastModified.getTime()).toBeCloseTo(Date.now(), -4); // max 5 s diff
    });

    test("convertDate - null", () => {
      expect(convertDate(null, DATETIME_FORMAT_2)).toBeNull();
    });

    test("convertDate - empty", () => {
      expect(convertDate("", DATETIME_FORMAT_2)).toBeNull();
    });

    test("convertDate - invalid format", () => {
      expect(convertDate("abcd", DATETIME_FORMAT_2)).toEqual("Invalid date");
    });

    test("convertDate - valid format 1", () => {
      expect(convertDate("2021-10-13 14:15:00", DATETIME_FORMAT_2)).toEqual(
        "2021-10-13T11:15:00.000Z",
      );
    });

    test("convertDate - multiple - valid format 1", () => {
      expect(
        convertDate("2021-11-01 14:15:00", DATE_FORMAT_2, DATETIME_FORMAT_2),
      ).toEqual(
        "2021-11-01T12:15:00.000Z",
      );
    });

    test("convertDate - valid format 2", () => {
      expect(convertDate("5.4.2012 14:15", DATETIME_FORMAT_1)).toEqual(
        "2012-04-05T11:15:00.000Z",
      );
    });

    test("convertDate - multiple - valid format 2", () => {
      expect(convertDate("5.4.2012 14:15", DATE_FORMAT_1, DATETIME_FORMAT_1))
        .toEqual(
          "2012-04-05T11:15:00.000Z",
        );
    });
  }),
);
