import { default as pgPromise } from "pg-promise";
import type { Camera, DbCamera } from "../model/camera.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";

const PS_CAMERA_IDS = new pgPromise.PreparedStatement({
  name: "get-camera-ids",
  text: "select id from camera where camera_group_id = $1",
});

const SQL_LIST_CAMERAS =
  "select id, name, camera_group_id, last_updated, st_y(location::geometry) lat, st_x(location::geometry) long from camera where camera_group_id in ($1:list)";

const PS_UPDATE_TIMESTAMP = new pgPromise.PreparedStatement({
  name: "update-timestamp",
  text: "update camera set last_updated = $1 where id = $2",
});

export async function getAllCameras(
  db: DTDatabase,
  usersGroups: string[],
): Promise<Camera[]> {
  // Prepared statement use not possible due to dynamic IN-list
  return (await db.manyOrNone(SQL_LIST_CAMERAS, [usersGroups])).map(
    (camera: DbCamera) => {
      return {
        id: camera.id,
        name: camera.name,
        cameraGroupId: camera.camera_group_id,
        lastUpdated: camera.last_updated,
        latitude: camera.lat,
        longitude: camera.long,
      };
    },
  );
}

export function updateCameraMetadata(
  db: DTDatabase,
  cameraIds: string[],
  updated: Date,
): Promise<PromiseSettledResult<unknown>[]> {
  return Promise.allSettled(
    cameraIds.map((cameraId: string) => {
      return db.none(PS_UPDATE_TIMESTAMP, [updated, cameraId]);
    }),
  );
}

export async function getAllCameraIdsForGroup(
  db: DTDatabase,
  groupId: string,
): Promise<string[]> {
  return (await db.manyOrNone(PS_CAMERA_IDS, [groupId])).map((
    x: { id: string },
  ) => x.id);
}
