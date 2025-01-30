import {
  type DTDatabase,
  type DTTransaction,
  inDatabase,
  inDatabaseReadonly,
  inTransaction,
} from "@digitraffic/common/dist/database/database";
import * as permitsService from "./permits.js";
import * as permitDb from "../db/permit.js";
import * as LastUpdatedDb from "@digitraffic/common/dist/database/last-updated";
import { DataType } from "@digitraffic/common/dist/database/last-updated";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export async function updatePermits(authKey: string, url: string) {
  const permitsInApi = await permitsService.getPermitsFromSource(authKey, url);
  const permitIdsInDb = await getAllPermitIdsFromDb();

  // eslint-disable-next-line dot-notation
  const dbIdList = permitIdsInDb.map((row) => row["source_id"]);
  const newPermits = permitsInApi.filter((permit) =>
    !dbIdList.includes(permit.sourceId)
  );

  const apiIdList = permitsInApi.map((permit) => permit.sourceId);

  const removedPermits = dbIdList.filter((id) =>
    // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
    !apiIdList.includes(id as string)
  );

  const updatedTimestamp = new Date();

  if (newPermits.length > 0) {
    await inTransaction((db: DTTransaction) => {
      return Promise.all([
        permitDb.insertPermits(db, newPermits),
        LastUpdatedDb.updateLastUpdated(
          db,
          DataType.PERMIT_DATA,
          updatedTimestamp,
        ),
      ]);
    });
  }

  if (removedPermits.length > 0) {
    await inTransaction((db: DTTransaction) => {
      return Promise.all([
        permitDb.setRemovedPermits(db, removedPermits as string[]),
        LastUpdatedDb.updateLastUpdated(
          db,
          DataType.PERMIT_DATA,
          updatedTimestamp,
        ),
      ]);
    });
  }

  await inDatabase((db: DTDatabase) =>
    LastUpdatedDb.updateLastUpdated(
      db,
      DataType.PERMIT_DATA_CHECK,
      updatedTimestamp,
    )
  );

  logger.info({
    method: "update.updatePermits",
    message: `count=${permitsInApi.length} insertCount=${newPermits.length}`,
  });
}

function getAllPermitIdsFromDb(): Promise<Record<string, string>[]> {
  return inDatabaseReadonly((db: DTDatabase) => {
    return permitDb.getAllPermitIds(db);
  });
}
