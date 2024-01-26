import { dbTestBase as commonDbTestBase } from "@digitraffic/common/dist/test/db-testutils";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";

export function dbTestBase(fn: (db: DTDatabase) => void): () => void {
    return commonDbTestBase(fn, truncate, "marinecam", "marinecam", "localhost:54321/marine");
}

export function truncate(db: DTDatabase): Promise<void> {
    return db.tx(async (t) => {
        await t.none("DELETE FROM camera");
        await t.none("DELETE FROM camera_group");
    });
}

export async function insertCameraGroup(db: DTDatabase, id: string, name: string): Promise<void> {
    await db.tx((t) => {
        return t.none(
            `
            insert into camera_group(id, name)
            values($1, $2)
        `,
            [id, name]
        );
    });
}

export async function insertCamera(db: DTDatabase, id: string, name: string, groupId: string): Promise<void> {
    await db.tx((t) => {
        return t.none(
            `
            insert into camera(id, name, camera_group_id, last_updated, location)
            values($1, $2, $3, current_date, 'POINT(1 1)')
        `,
            [id, name, groupId]
        );
    });
}
