import {DTDatabase, DTTransaction, inDatabase, inDatabaseReadonly, inTransaction} from "@digitraffic/common/database/database";
import * as permitsService from "./permits";
import * as permitDb from "../db/permit";
import * as LastUpdatedDb from "@digitraffic/common/database/last-updated";
import {DataType} from "@digitraffic/common/database/last-updated";

export async function updatePermits(authKey: string, url: string) {
    const permitsInApi = await permitsService.getPermitsFromSource(authKey, url);
    const permitIdsInDb = await getAllPermitIdsFromDb();

    const dbIdList = permitIdsInDb.map(row => row.source_id);
    const newPermits = permitsInApi.filter(permit => !dbIdList.includes(permit.sourceId));

    const apiIdList = permitsInApi.map(permit => permit.sourceId);
    const removedPermits = dbIdList.filter(id => !apiIdList.includes(id));

    const updatedTimestamp = new Date();

    if (newPermits.length > 0) {
        await inTransaction((db: DTTransaction) => {
            return Promise.all([
                permitDb.insertPermits(db, newPermits),
                LastUpdatedDb.updateLastUpdated(db, DataType.PERMIT_DATA, updatedTimestamp)]);
        });
    }

    if (removedPermits.length > 0) {
        await inTransaction((db: DTTransaction) => {
            return Promise.all([
                permitDb.setRemovedPermits(db, removedPermits),
                LastUpdatedDb.updateLastUpdated(db, DataType.PERMIT_DATA, updatedTimestamp)]);
        });
    }

    await inDatabase((db: DTDatabase) => LastUpdatedDb.updateLastUpdated(db, DataType.PERMIT_DATA_CHECK, updatedTimestamp));

    console.info("method=UpdateService.updatePermits count=%d insertCount=%d", permitsInApi.length, newPermits.length);
}

function getAllPermitIdsFromDb(): Promise<Record<string, string>[]> {
    return inDatabaseReadonly((db: DTDatabase) => {
        return permitDb.getAllPermitIds(db);
    });
}
