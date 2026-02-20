import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { jest } from "@jest/globals";
import { addHours } from "date-fns";
import { NemoApi } from "../../api/nemo-api.js";
import type { NemoResponse } from "../../model/nemo.js";
import { updateVisits } from "../../service/visit-service.js";
import { assertVisitCount, dbTestBase } from "../db-testutil.js";
import { createTestVisit } from "../testdata.js";

export async function updateAndExpect(
  response: NemoResponse,
  expectInserted: number,
  expectUpdated: number,
  expectItems: number,
): Promise<void> {
  jest.spyOn(NemoApi.prototype, "getVisits").mockResolvedValue(response);

  const updated = await updateVisits("", "", "", 0);

  expect(updated.inserted).toBe(expectInserted);
  expect(updated.updated).toBe(expectUpdated);
  expect(updated.items).toBe(expectItems);
}

const now = new Date();

const TEST_RESPONSE = [
  {
    visitId: "32ab881cf91a46428e8bc916bdf753f2",
    portCall: {
      vesselInformation: {
        identification: "9878319",
        name: "AURORA BOTNIA",
      },
      voyageInformation: {
        portIdentification: "FIVAA",
        estimatedArrivalDateTime: addHours(now, 1).toISOString(),
        estimatedDepartureDateTime: addHours(now, 2).toISOString(),
      },
      arrivalNotification: { actualArrivalDateTime: null },
      departureNotification: { actualDepartureDateTime: null },
      portCallStatus: { status: "Expected to Arrive" },
    },
    latestUpdateTime: now.toISOString(),
  },
  {
    visitId: "667c3398d7794c2eb4b84aac130b422b",
    portCall: {
      vesselInformation: {
        identification: "9878319",
        name: "AURORA BOTNIA",
      },
      voyageInformation: {
        portIdentification: "FIVAA",
        estimatedArrivalDateTime: addHours(now, 3).toISOString(),
        estimatedDepartureDateTime: addHours(now, 4).toISOString(),
      },
      arrivalNotification: {
        actualArrivalDateTime: addHours(now, 2).toISOString(),
      },
      departureNotification: { actualDepartureDateTime: null },
      portCallStatus: { status: "Arrived" },
    },
    latestUpdateTime: now.toISOString(),
  },
] as unknown as NemoResponse;

describe(
  "visit-service-tests",
  dbTestBase((db: DTDatabase) => {
    test("update visits - no new visits", async () => {
      await updateAndExpect([], 0, 0, 0);
      await assertVisitCount(db, 0);
    });

    test("update visits - one new visit", async () => {
      await updateAndExpect([createTestVisit()], 1, 0, 1);
      await assertVisitCount(db, 1);
    });

    test("update visits - new visit then update", async () => {
      await updateAndExpect([createTestVisit("ID", "P1")], 1, 0, 1);
      await assertVisitCount(db, 1);

      await updateAndExpect([createTestVisit("ID", "P2")], 0, 1, 1);
      await assertVisitCount(db, 1);
    });

    test("update visits - new visit then update but no change", async () => {
      const testVisit = createTestVisit("ID", "P1");
      await updateAndExpect([testVisit], 1, 0, 1);
      await assertVisitCount(db, 1);

      await updateAndExpect([testVisit], 0, 0, 1);
      await assertVisitCount(db, 1);
    });

    test("update visits - from test response", async () => {
      await updateAndExpect(TEST_RESPONSE, 2, 0, 2);
      await assertVisitCount(db, 2);

      await updateAndExpect(TEST_RESPONSE, 0, 0, 2);
      await assertVisitCount(db, 2);
    });
  }),
);
