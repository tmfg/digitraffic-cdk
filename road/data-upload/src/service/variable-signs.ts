import {
  type DTDatabase,
  inDatabase,
} from "@digitraffic/common/dist/database/database";
import { updateDatex2 } from "../dao/variable-signs.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { type DataIncomingDb, getNewData, updateStatus } from "../dao/data.js";
import { Datex2Version, SOURCES, TYPES } from "../model/types.js";
import { parseSituations223 } from "./vs-datex2-223-parser.js";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { parseDatex } from "./vs-datex2-35-parser.js";

export type DatexType = "SITUATION" | "CONTROLLER_STATUS";
export interface DatexFile {
  id: string;
  type: DatexType;
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
  let updated223Count = 0;
  let updated35Count = 0;
  let error223Count = 0;
  let error35Count = 0;
  let unknownCount = 0;
  const xml = data.data;
  const started = Date.now();

  switch (data.version) {
    case Datex2Version["2.2.3"]:
      const situations223 = parseSituations223(xml);

      if (situations223.length === 0) {
        logger.debug(`No situations parsed from ${data.data_id}!`);
      }

      await Promise.allSettled(situations223.map(async (s) => {
        updated223Count++;
        try {
          await updateDatex2(
            db,
            s.id,
            data.version,
            s.type,
            s.datex2,
            s.effectDate,
          );
        } catch (error) {
          logException(logger, error);
          error223Count++;
        }
      }));

      break;

    case Datex2Version["3.5"]:
      const situations35 = parseDatex(xml);

      if (situations35.length === 0) {
        logger.debug(`No situations parsed from ${data.data_id}!`);
      }

      await Promise.allSettled(situations35.map(async (s) => {
        updated35Count++;
        try {
          await updateDatex2(
            db,
            s.id,
            data.version,
            s.type,
            s.datex2,
            s.effectDate,
          );
        } catch (error) {
          logException(logger, error);
          error35Count++;
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
    customDatexVersion: Datex2Version["2.2.3"],
    customUpdatedCount: updated223Count,
    customErrorCount: error223Count,
  });

  logger.info({
    method,
    customDatexVersion: Datex2Version["3.5"],
    customUpdatedCount: updated35Count,
    customErrorCount: error35Count,
  });

  logger.info({
    method,
    customUnknownCount: unknownCount,
    tookMs: Date.now() - started,
  });
}
