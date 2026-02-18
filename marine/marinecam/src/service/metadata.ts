import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import {
  inDatabase,
  inDatabaseReadonly,
} from "@digitraffic/common/dist/database/database";

import * as MetadataDB from "../db/metadata.js";

import type { Camera } from "../model/camera.js";

export async function listAllCameras(usersGroups: string[]): Promise<Camera[]> {
  logger.info({
    method: "MetadataService.listAllCameras",
    message: `listing for ${usersGroups.toString()}`,
  });

  const start = Date.now();

  try {
    return await inDatabaseReadonly((db: DTDatabase) => {
      return MetadataDB.getAllCameras(db, usersGroups);
    });
  } finally {
    logger.info({
      method: "MetadataService.listAllCameras",
      tookMs: Date.now() - start,
    });
  }
}

export function updateMetadataUpdated(
  cameraIds: string[],
  updated: Date,
): Promise<void> {
  return inDatabase(async (db: DTDatabase) => {
    await MetadataDB.updateCameraMetadata(db, cameraIds, updated);
  });
}

export function getAllCameraIdsForGroup(groupId: string): Promise<string[]> {
  return inDatabaseReadonly((db: DTDatabase) => {
    return MetadataDB.getAllCameraIdsForGroup(db, groupId);
  });
}
