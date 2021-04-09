import {IDatabase, PreparedStatement} from "pg-promise";

const PS_CAMERA_IDS = new PreparedStatement({
    name: 'get-camera-ids',
    text: 'select id from camera'
});

const PS_UPDATE_TIMESTAMP = new PreparedStatement({
    name: 'update-timestamp',
    text: 'update camera set last_updated = $1 where id = $2'
});

export async function getAllCameraIds(db: IDatabase<any, any>): Promise<string[]> {
    return (await db.manyOrNone(PS_CAMERA_IDS)).map((x: any) => x.id);
}

export async function updateCameraMetadata(db: IDatabase<any, any>, cameraId: string, updated: Date) {
    return await db.none(PS_UPDATE_TIMESTAMP, [updated, cameraId]);
}
