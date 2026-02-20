import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type {
  DTDatabase,
  DTTransaction,
} from "@digitraffic/common/dist/database/database";
import { inDatabase } from "@digitraffic/common/dist/database/database";
import * as LastUpdatedDB from "@digitraffic/common/dist/database/last-updated";
import { FaultsApi } from "../api/faults.js";
import * as FaultsDB from "../db/faults.js";
import type { FaultFeature } from "../model/fault.js";
import { ATON_FAULTS_CHECK } from "./faults.js";

export async function updateFaults(url: string, domain: string): Promise<void> {
  const start = Date.now();

  const newFaults = await new FaultsApi(url).getFaults();
  const validated = newFaults.filter(validate);

  await inDatabase((db: DTDatabase) => {
    return db.tx((t: DTTransaction) => {
      return t.batch([
        ...FaultsDB.updateFaults(db, domain, validated),
        LastUpdatedDB.updateUpdatedTimestamp(
          db,
          ATON_FAULTS_CHECK,
          new Date(start),
        ),
      ]);
    });
  }).finally(() => {
    const end = Date.now();
    logger.info({
      method: "UpdateFaultsService.updateFaults",
      tookMs: end - start,
      customUpdatedCount: newFaults.length,
    });
  });
}

function validate(fault: FaultFeature): boolean {
  if (fault.properties.FAULT_STATE === "Aiheeton") {
    logger.info({
      method: "UpdateFaultsService.validate",
      message: "Aiheeton id",
      customCode: fault.properties.ID,
    });
  }

  return fault.properties.FAULT_STATE !== "Kirjattu";
}
