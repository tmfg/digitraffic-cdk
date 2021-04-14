import {IDatabase, PreparedStatement} from "pg-promise";
import {Camera} from "../model/camera";

const PS_CAMERA_IDS = new PreparedStatement({
    name: 'get-camera-ids',
    text: 'select id from camera'
});

const SQL_LIST_CAMERAS = "select id, name, camera_group_id, last_updated  from camera where camera_group_id in ($1:list)";

const PS_UPDATE_TIMESTAMP = new PreparedStatement({
    name: 'update-timestamp',
    text: 'update camera set last_updated = $1 where id = $2'
});

export async function getAllCameras(db: IDatabase<any, any>, usersGroups: string[]): Promise<Camera[]> {
    // Prepared statement use not possible due to dynamic IN-list
    return (await db.manyOrNone(SQL_LIST_CAMERAS, [usersGroups])).map((x: any) => ({
            id: x.id,
            name: x.name,
            cameraGroupId: x.camera_group_id,
            lastUpdated: x.last_updated
        }));
}

export async function updateCameraMetadata(db: IDatabase<any, any>, cameraId: string, updated: Date) {
    return await db.none(PS_UPDATE_TIMESTAMP, [updated, cameraId]);
}

export async function getAllCameraIds(db: IDatabase<any, any>): Promise<string[]> {
    return (await db.manyOrNone(PS_CAMERA_IDS)).map((x: any) => x.id);
}