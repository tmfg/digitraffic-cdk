import {
  type DTDatabase,
  inDatabase,
} from "@digitraffic/common/dist/database/database";
import { updateDatex2 } from "../dao/variable-signs.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { type DataIncomingDb, getNewData, updateStatus } from "../dao/data.js";
import { Datex2Version, SOURCES, TYPES } from "../model/types.js";
import { parseSituations233 } from "./vs-datex2-233-parser.js";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { parseSituations35 } from "./vs-datex2-35-parser.js";

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

        await updateStatus(db, data.data_id, "FAILED");
      }
    }));
  });
}

async function handleVariableSign(
  db: DTDatabase,
  data: DataIncomingDb,
): Promise<void> {
  const method = "VariableSignsService.handleVariableSign";
  let updated23Count = 0;
  let updated35Count = 0;
  let error23Count = 0;
  let error35Count = 0;
  let unknownCount = 0;
  const xml = data.data;
  // validate xml here?
  // get id,

  switch (data.version) {
    case Datex2Version["2.3.3"]:
      const situations23 = parseSituations233(xml);

      await Promise.allSettled(situations23.map(async (s) => {
        updated23Count++;
        try {
          logger.debug("2.3.3 updating " + s.id);
          return await updateDatex2(
            db,
            s.id,
            data.version,
            s.datex2,
            s.effectDate,
          );
        } catch (error) {
          logException(logger, error);
          error23Count++;

          return Promise.resolve();
        }
      }));

      break;

    case Datex2Version["3.5"]:
      const situations35 = parseSituations35(xml);

      await Promise.allSettled(situations35.map(async (s) => {
        updated35Count++;
        try {
          logger.debug("3.5 updating " + s.id);
          return await updateDatex2(
            db,
            s.id,
            data.version,
            s.datex2,
            s.effectDate,
          );
        } catch (error) {
          logException(logger, error);
          error35Count++;
          return Promise.resolve();
        }
      }));

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
    customVersion: Datex2Version["2.3.3"],
    customUpdatedCount: updated23Count,
    customErrorCount: error23Count,
  });

  logger.info({
    method,
    customVersion: Datex2Version["3.5"],
    customUpdatedCount: updated35Count,
    customErrorCount: error35Count,
  });

  logger.info({
    method,
    customUnknownCount: unknownCount,
  });
}
