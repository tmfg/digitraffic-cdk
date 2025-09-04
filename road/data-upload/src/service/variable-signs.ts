import { inDatabase } from "@digitraffic/common/dist/database/database";
import { updateStatus } from "../dao/variable-signs.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { type DataIncomingDb, getNewData } from "../dao/data.js";
import { SOURCES, TYPES } from "../model/types.js";

export async function handleVariableSignMessages(): Promise<void> {
  await inDatabase(async (db) => {
    const unhandled = await getNewData(db, SOURCES.API, TYPES.VS);

    await Promise.all(unhandled.map(async (vs) => {
      logger.debug("Inserting " + JSON.stringify(vs));

      try {
        await handleVariableSign(vs);

        await updateStatus(db, vs.data_id, "PROCESSED");
      } catch (error) {
        logger.error({
          method: "VariableSignsService.handleVariableSignMessages",
          error,
        });

        await updateStatus(db, vs.data_id, "FAILED");
      }
    }));
  });
}

async function handleVariableSign(vs: DataIncomingDb): Promise<void> {
  // validate xml here?
  // insert into device_data_datex2
}
