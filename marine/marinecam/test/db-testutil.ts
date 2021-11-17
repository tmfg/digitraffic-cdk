import {IDatabase, ITask} from "pg-promise";
import {dbTestBase as commonDbTestBase} from "digitraffic-common/test/db-testutils";

export function inTransaction(db: IDatabase<unknown>, fn: (t: ITask<unknown>) => void) {
    return async () => {
        await db.tx(async (t: ITask<unknown>) => await fn(t));
    };
}

export function dbTestBase(fn: (db: IDatabase<unknown>) => void) {
    return commonDbTestBase(fn, truncate, 'marinecam', 'marinecam', 'localhost:54321/marine');
}

export async function truncate(db: IDatabase<unknown>): Promise<any> {
    return db.tx(async t => {
        await t.none('DELETE FROM camera');
        await t.none('DELETE FROM camera_group');
    });
}

export function insertCameraGroup(db: IDatabase<unknown>, id: string, name: string) {
    return db.tx(t => {
        return t.none(`
            insert into camera_group(id, name)
            values($1, $2)
        `, [id, name]);
    });
}

export function insertCamera(db: IDatabase<unknown>, id: string, name: string, groupId: string) {
    return db.tx(t => {
        return t.none(`
            insert into camera(id, name, camera_group_id, last_updated)
            values($1, $2, $3, current_date)
        `, [id, name, groupId]);
    });
}
