import {IDatabase, ITask} from "pg-promise";
import {dbTestBase as commonDbTestBase} from "digitraffic-common/test/db-testutils";

export function inTransaction(db: IDatabase<any, any>, fn: (t: ITask<any>) => void) {
    return async () => {
        await db.tx(async (t: any) => await fn(t));
    };
}

export function dbTestBase(fn: (db: IDatabase<any, any>) => void) {
    return commonDbTestBase(fn, truncate, 'marinecam', 'marinecam', 'localhost:54321/marine');
}

export async function truncate(db: IDatabase<any, any>): Promise<any> {
    return db.tx(async t => {
            return await db.none('DELETE FROM camera').then(async () => {
                await db.none('DELETE FROM camera_group');
            });
        });
}

export function insertCameraGroup(db: IDatabase<any, any>, id: string, name: string) {
    return db.tx(t => {
        return t.none(`
            insert into camera_group(id, name)
            values($1, $2)
        `, [id, name]);
    });
}

export function insertCamera(db: IDatabase<any, any>, id: string, name: string, groupId: string) {
    return db.tx(t => {
        return t.none(`
            insert into camera(id, name, camera_group_id, last_updated)
            values($1, $2, $3, current_date)
        `, [id, name, groupId]);
    });
}
