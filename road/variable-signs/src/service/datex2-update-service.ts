import {
  type DTDatabase,
  type DTTransaction,
  inDatabase,
} from "@digitraffic/common/dist/database/database";
import type { Situation } from "../model/situation.js";
import {
  type StatusCodeValue,
  StatusCodeValues,
} from "../model/status-code-value.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { saveDatex2 } from "../db/datex2.js";
import {
  DataType,
  updateLastUpdated,
} from "@digitraffic/common/dist/database/last-updated";

const REG_PAYLOAD = /<payloadPublication/g;

const DATEX2_SITUATION_TAG_START = "<situation ";
const DATEX2_SITUATION_TAG_END = "</situation>";
const DATEX2_OVERALL_STARTTIME_TAG_START = "<overallStartTime>";
const DATEX2_OVERALL_STARTTIME_TAG_END = "</overallStartTime>";
const DATEX2_VERSION_ATTRIBUTE = "version=";
const XML_TAG_START = "<?xml";

export async function updateDatex2(datex2: string): Promise<StatusCodeValue> {
  const start = Date.now();
  const timestamp = new Date(start);

  if (!validate(datex2)) {
    return await Promise.resolve(StatusCodeValues.BAD_REQUEST);
  }

  // DATEX2-integration through new API

  const situations = parseSituations(datex2);

  await inDatabase((db: DTDatabase) => {
    return db.tx((tx: DTTransaction) => {
      return tx.batch([
        saveDatex2(tx, situations),
        updateLastUpdated(
          tx,
          DataType.VS_DATEX2,
          timestamp,
        ),
      ]);
    });
  }).finally(() => {
    logger.info({
      method: "Datex2UpdateService.updateDatex2",
      tookMs: Date.now() - start,
      customUpdatedCount: situations.length,
    });
  });

  return StatusCodeValues.OK;
}

export function parseSituations(datex2: string): Situation[] {
  const situations: Situation[] = [];
  let index = 0;
  let sitIndex = 0;

  // go through the document and find all situation-blocks
  // add them to the list and return them
  do {
    sitIndex = datex2.indexOf(DATEX2_SITUATION_TAG_START, index);

    if (sitIndex !== -1) {
      const sitEndIndex = datex2.indexOf(
        DATEX2_SITUATION_TAG_END,
        sitIndex + DATEX2_SITUATION_TAG_START.length,
      );
      index = sitEndIndex;

      situations.push(
        parseSituation(
          datex2.substring(
            sitIndex,
            sitEndIndex + DATEX2_SITUATION_TAG_END.length,
          ),
        ),
      );
    }
  } while (sitIndex !== -1);

  return situations;
}

function parseSituation(datex2: string): Situation {
  return {
    id: parseId(datex2),
    datex2: datex2,
    effectDate: parseEffectDate(datex2),
  };
}

function parseId(datex2: string): string {
  const index = datex2.indexOf(DATEX2_VERSION_ATTRIBUTE);
  return datex2.substring(15, index - 2);
}

function parseEffectDate(datex2: string): Date {
  const index = datex2.indexOf(DATEX2_OVERALL_STARTTIME_TAG_START) +
    DATEX2_OVERALL_STARTTIME_TAG_START.length;
  const index2 = datex2.indexOf(DATEX2_OVERALL_STARTTIME_TAG_END, index);
  const dateString = datex2.substring(index, index2);

  return new Date(dateString);
}

function validate(datex2: string): boolean {
  if (!datex2.includes(XML_TAG_START)) {
    logger.error({
      method: "Datex2UpdateService.validate",
      message: "no xml-tag",
    });
    return false;
  }

  const ppCount = occurrences(datex2, REG_PAYLOAD);
  if (ppCount !== 1) {
    logger.error({
      method: "Datex2UpdateService.validate",
      message: `${ppCount} payloadPublications`,
    });

    return false;
  }

  return true;
}

function occurrences(string: string, regexp: RegExp): number {
  return (string.match(regexp) ?? []).length;
}
