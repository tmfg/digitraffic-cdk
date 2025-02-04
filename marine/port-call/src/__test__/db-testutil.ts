import { dbTestBase as commonDbTestBase } from "@digitraffic/common/dist/test/db-testutils";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import * as VisitsDAO from "../db/visits.js";

export function dbTestBase(fn: (db: DTDatabase) => void): () => void {
    return commonDbTestBase(fn, truncate, "marine", "marine", "127.0.0.1:54321/marine");
}

async function truncate(db: DTDatabase): Promise<void> {
    await db.tx((t) => {
        return t.batch([t.none("DELETE FROM pc2_visit")]);
    });
}

export async function assertVisitCount(db: DTDatabase, expectedCount: number): Promise<void> {
        const visits = await VisitsDAO.findAllVisits(db);
        expect(visits.length).toBe(expectedCount);
}