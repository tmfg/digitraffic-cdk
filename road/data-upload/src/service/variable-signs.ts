import {
  type DTDatabase,
  inDatabase,
} from "@digitraffic/common/dist/database/database";
import { insertDatex2 } from "../dao/variable-signs.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { type DataIncomingDb, getNewData, updateStatus } from "../dao/data.js";
import { SOURCES, TYPES } from "../model/types.js";

export async function handleVariableSignMessages(): Promise<void> {
  await inDatabase(async (db) => {
    const unhandled = await getNewData(db, SOURCES.API, TYPES.VS_DATEX2_XML);

    await Promise.all(unhandled.map(async (data) => {
      logger.debug("Inserting " + JSON.stringify(data));

      try {
        await handleVariableSign(db, data);

        await updateStatus(db, data.data_id, "PROCESSED");
      } catch (error) {
        logger.error({
          method: "VariableSignsService.handleVariableSignMessages",
          error,
        });

        await updateStatus(db, data.data_id, "FAILED");
      }
    }));
  });
}

async function handleVariableSign(
  db: DTDatabase,
  data: DataIncomingDb,
): Promise<void> {
  const xml = data.data;
  // validate xml here?
  // get id,
  await insertDatex2(db, "id1", xml, new Date());
}
