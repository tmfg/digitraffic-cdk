import {
  type DTDatabase,
  inDatabase,
} from "@digitraffic/common/dist/database/database";
import { insertDatex2 } from "../dao/variable-signs.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { type DataIncomingDb, getNewData, updateStatus } from "../dao/data.js";
import { Datex2Version, SOURCES, TYPES } from "../model/types.js";
import { parseSituations } from "./vs-datex2-233-parser.js";
import { logException } from "@digitraffic/common/dist/utils/logging";

export interface Situation {
  id: string;
  datex2: string;
  effectDate: Date;
}

export async function handleVariableSignMessages(): Promise<void> {
  await inDatabase(async (db) => {
    const unhandled = await getNewData(db, SOURCES.API, TYPES.VS_DATEX2_XML);

    await Promise.allSettled(unhandled.map(async (data) => {
      try {
        await handleVariableSign(db, data);

        await updateStatus(db, data.data_id, "PROCESSED");
      } catch (error) {
        logger.error({
          method: "VariableSignsService.handleVariableSignMessages",
          error,
        });

        updateStatus(db, data.data_id, "FAILED");
      }
    }));
  });
}

async function handleVariableSign(
  db: DTDatabase,
  data: DataIncomingDb,
): Promise<void> {
  const method = "VariableSignsService.handleVariableSign";
  let updatedCount = 0;
  let skippedCount = 0;
  let unknownCount = 0;
  const xml = data.data;
  // validate xml here?
  // get id,

  switch (data.version) {
    case Datex2Version["2.3.3"]:
      const situations = parseSituations(xml);

      await Promise.allSettled(situations.map(async (s) => {
        updatedCount++;
        try {
          return await insertDatex2(db, s.id, s.datex2, s.effectDate);
        } catch (error) {
          logException(logger, error);
          return Promise.resolve();
        }
      }));

      break;
    case Datex2Version["3.5"]:
      skippedCount++;
      // skipping 3.5 for now
      break;
    default:
      unknownCount++;
      logger.error({
        method,
        message: `Unknown variable sign version ${data.version}`,
      });
  }

  logger.info({
    method,
    customUpdatedCount: updatedCount,
    customSkippedCount: skippedCount,
    customUnknownCount: unknownCount,
  });
}
