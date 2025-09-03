import { inDatabase } from "@digitraffic/common/dist/database/database";
import { getUnhandled, updateStatus } from "../dao/variable-signs.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export async function handleVariableSignMessages(): Promise<void> {
  await inDatabase(async (db) => {
    const unhandled = await getUnhandled(db);

    await Promise.all(unhandled.map(async (vs) => {
      logger.debug("Inserting " + JSON.stringify(vs));

      // insert into device_datex2?
      await updateStatus(db, vs.data_id, "PROCESSED");
    }));
  });
}
