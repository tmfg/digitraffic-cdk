import {DTDatabase, DTTransaction, inDatabase, inDatabaseReadonly, inTransaction} from "digitraffic-common/database/database";
import * as permitsService from "./permits";
import * as permitDb from "../db/excavation-permit";

export async function updatePermits(authKey: string, url: string) {
    const permitsInApi = await permitsService.getExcavationPermits(authKey, url);
    const permitIdsInDb = await getAllPermitIdsFromDb();

    const idList = permitIdsInDb.map(row => row.sourceId);
    const newPermits = permitsInApi.filter(permit => !idList.includes(permit.sourceId));

    if (newPermits.length > 0) {
        await inTransaction((db: DTTransaction) => {
            return permitDb.insertPermits(db, newPermits);
        });
    }

    console.info("method=UpdateService.updatePermits count=%d insertCount=%d", permitIdsInDb.length, newPermits.length);
}

async function getAllPermitIdsFromDb(): Promise<Record<string, string>[]> {
    return await inDatabaseReadonly((db: DTDatabase) => {
        return permitDb.getAllPermitIds(db);
    });
}
