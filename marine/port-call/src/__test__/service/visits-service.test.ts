import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { jest } from "@jest/globals";
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
        estimatedArrivalDateTime: "2025-03-19T13:00:00.00+02:00",
        estimatedDepartureDateTime: "2025-03-19T14:00:00.00+02:00",
      },
      arrivalNotification: { actualArrivalDateTime: null },
      departureNotification: { actualDepartureDateTime: null },
      portCallStatus: { status: "Expected to Arrive" },
    },
    latestUpdateTime: "2025-03-19T12:42:49.852078+02:00",
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
        estimatedArrivalDateTime: "2025-03-19T15:00:00.00+02:00",
        estimatedDepartureDateTime: "2025-03-19T16:00:00.00+02:00",
      },
      arrivalNotification: {
        actualArrivalDateTime: "2025-03-19T14:50:00.00+02:00",
      },
      departureNotification: { actualDepartureDateTime: null },
      portCallStatus: { status: "Arrived" },
    },
    latestUpdateTime: "2025-03-19T14:49:55.638824+02:00",
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
