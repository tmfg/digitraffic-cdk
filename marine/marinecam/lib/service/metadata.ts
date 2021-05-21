import {inDatabase} from "../../../../common/postgres/database";
import * as MetadataDB from "../db/metadata";

import {IDatabase} from "pg-promise";
import {Camera} from "../model/camera";

export async function listAllCameras(usersGroups: string[]): Promise<Camera[]> {
    console.info("listing cameras for " + usersGroups);

    const start = Date.now();

    try {
        return await inDatabase(async (db: IDatabase<any, any>) => {
            return await MetadataDB.getAllCameras(db, usersGroups);
        });
    } finally {
        console.info("method=listAllCameras tookMs=%d", (Date.now() - start));
    }
}

export async function updateMetadataUpdated(cameraIds: string[], updated: Date): Promise<any> {
    return await inDatabase(async (db: IDatabase<any,any>) => {
        return await MetadataDB.updateCameraMetadata(db, cameraIds, updated);
    });
}

export async function getAllCameraIdsForGroup(groupId: string): Promise<string[]> {
    return await inDatabase(async (db: IDatabase<any,any>) => {
        return await MetadataDB.getAllCameraIdsForGroup(db, groupId);
    });
}