import {DTDatabase, inDatabase, inDatabaseReadonly} from "digitraffic-common/database/database";
import * as permitsService from "./permits";
import * as permitDb from "../db/excavation-permit";

export async function updatePermits(authKey: string, url: string) {
    const permitsInApi = await permitsService.getExcavationPermits(authKey, url);
    const permitIdsInDb = await getAllPermitIdsFromDb();

    const idList = permitIdsInDb.map(row => row.id);
    const newPermits = permitsInApi.filter(permit => !idList.includes(permit.id));

    if (newPermits.length > 0) {
        await inDatabase((db: DTDatabase) => {
            return permitDb.insertPermits(db, newPermits);
        });
    }
}

async function getAllPermitIdsFromDb(): Promise<Record<string, string>[]> {
    const idRows = await inDatabaseReadonly((db: DTDatabase) => {
        return permitDb.getAllPermitIds(db);
    }) as unknown as Record<string, string>[];
    return idRows;
}
