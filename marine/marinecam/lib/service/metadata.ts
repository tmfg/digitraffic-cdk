import {inDatabase} from "../../../../common/postgres/database";
import * as MetadataDB from "../db/metadata";

import {IDatabase} from "pg-promise";

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