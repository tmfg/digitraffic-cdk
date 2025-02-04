import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { assertVisitCount, dbTestBase } from "../db-testutil.js";
import { updateVisits } from "../../service/visit-service.js";
import { NemoApi } from "../../api/nemo-api.js";
import { jest } from "@jest/globals";
import { createTestVisit } from "../testdata.js";
import type { NemoResponse } from "../../model/nemo.js";

export async function updateAndExpect(response: NemoResponse, expectInserted: number = 0, expectUpdated: number = 0): Promise<void> {
    jest.spyOn(NemoApi.prototype, "getVisits").mockResolvedValue(response);

    const updated = await updateVisits("", "", "", "");

    expect(updated.inserted).toBe(expectInserted);
    expect(updated.updated).toBe(expectUpdated);
}

describe(
    "visit-service-tests",
    dbTestBase((db: DTDatabase) => {
        test("update visits - no new visits", async () => {
            await updateAndExpect([]);
            await assertVisitCount(db, 0);
        });

        test("update visits - one new visit", async () => {
            await updateAndExpect([createTestVisit()], 1);
            await assertVisitCount(db, 1);
        });

        test("update visits - new visit then update", async () => {
            await updateAndExpect([createTestVisit("ID", "P1")], 1, 0);
            await assertVisitCount(db, 1);

            await updateAndExpect([createTestVisit("ID", "P2")], 0, 1);
            await assertVisitCount(db, 1);
        });

        test("update visits - new visit then update but no change", async () => {
            await updateAndExpect([createTestVisit("ID", "P1")], 1, 0);
            await assertVisitCount(db, 1);

            await updateAndExpect([createTestVisit("ID", "P1")], 0, 0);
            await assertVisitCount(db, 1);
        });

    })
);
