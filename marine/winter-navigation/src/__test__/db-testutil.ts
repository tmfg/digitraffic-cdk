import { assertCount, dbTestBase as commonDbTestBase } from "@digitraffic/common/dist/test/db-testutils";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import type { TableName } from "../db/deleted.js";

export function dbTestBase(fn: (db: DTDatabase) => void): () => void {
    return commonDbTestBase(fn, truncate, "marine", "marine", "127.0.0.1:54321/marine");
}

async function truncate(db: DTDatabase): Promise<void> {
    //return;
    await db.tx((t) => {
        return t.batch([
            t.none("DELETE FROM wn_location"),
            t.none("DELETE FROM wn_restriction"),
            t.none("DELETE FROM wn_vessel"),
            t.none("DELETE FROM wn_activity"),
            t.none("DELETE FROM wn_source")
        ]);
    });
}

export async function assertCountFromTable(
    db: DTDatabase,
    tableName: TableName,
    count: number,
    deletedCount: number = 0
): Promise<void> {
    await assertCount(db, `select count(*) from ${tableName}`, count);
    await assertCount(db, `select count(*) from ${tableName} where deleted = true`, deletedCount);
}

export async function assertLocationCount(
    db: DTDatabase,
    count: number,
    deletedCount: number = 0
): Promise<void> {
    await assertCountFromTable(db, "wn_location", count, deletedCount);
}

export async function assertRestrictionCount(
    db: DTDatabase,
    count: number,
    deletedCount: number = 0
): Promise<void> {
    await assertCountFromTable(db, "wn_restriction", count, deletedCount);
}

export async function assertActivityCount(
    db: DTDatabase,
    count: number,
    deletedCount: number = 0
): Promise<void> {
    await assertCountFromTable(db, "wn_activity", count, deletedCount);
}

export async function assertSourceCount(
    db: DTDatabase,
    count: number,
    deletedCount: number = 0
): Promise<void> {
    await assertCountFromTable(db, "wn_source", count, deletedCount);
}

export async function assertVesselCount(
    db: DTDatabase,
    count: number,
    deletedCount: number = 0
): Promise<void> {
    await assertCountFromTable(db, "wn_vessel", count, deletedCount);
}
