import type { Situation } from "./variable-signs.js";

//const REG_PAYLOAD = /<payloadPublication/g;

const DATEX2_SITUATION_TAG_START = "<ns3:situation ";
const DATEX2_SITUATION_TAG_END = "</ns3:situation>";
const DATEX2_OVERALL_STARTTIME_TAG_START = "<overallStartTime>";
const DATEX2_OVERALL_STARTTIME_TAG_END = "</overallStartTime>";
//const XML_TAG_START = "<?xml";

export function parseSituations35(datex2: string): Situation[] {
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
  const index = datex2.indexOf('">');
  return datex2.substring(19, index);
}

function parseEffectDate(datex2: string): Date {
  const index = datex2.indexOf(DATEX2_OVERALL_STARTTIME_TAG_START) +
    DATEX2_OVERALL_STARTTIME_TAG_START.length;
  const index2 = datex2.indexOf(DATEX2_OVERALL_STARTTIME_TAG_END, index);
  const dateString = datex2.substring(index, index2);

  return new Date(dateString);
}
/*
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
}*/
