import {inDatabase} from "../../../../common/postgres/database";
import * as MetadataDB from "../db/metadata";

import {IDatabase} from "pg-promise";
import {Camera} from "../model/camera";

export async function listAllCameras(usersGroups: string[]): Promise<Camera[]> {
    console.info("listing cameras for " + usersGroups);

    return await inDatabase(async (db: IDatabase<any,any>) => {
        return await MetadataDB.getAllCameras(db, usersGroups);
    });
}

export async function updateMetadataUpdated(cameraId: string, updated: Date): Promise<any> {
    return await inDatabase(async (db: IDatabase<any,any>) => {
        return await MetadataDB.updateCameraMetadata(db, cameraId, updated);
    });
}

export async function getAllCameraIds(): Promise<string[]> {
    return await inDatabase(async (db: IDatabase<any,any>) => {
        return await MetadataDB.getAllCameraIds(db);
    });
}