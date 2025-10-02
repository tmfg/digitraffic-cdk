import type { DatexFile, DatexType } from "./variable-signs.js";
import { findWithReg, getTags } from "./xml-util.js";

const TAGS = {
  OVERALL_STARTTIME_START: "overallStartTime>",
  OVERALL_STARTTIME_END_REG: /<\/.*overallStartTime>/,
  STATUS_UPDATE_START: "statusUpdateTime>",
  STATUS_UPDATE_END_REGF: /<\/.*statusUpdateTime>/,
} as const;

export function parseDatex(datex2: string): DatexFile[] {
  switch (getType(datex2)) {
    case "SITUATION":
      return getSituations(datex2);
    case "CONTROLLER_STATUS":
      return getControllerStatuses(datex2);
    case "CONTROLLER":
      return getControllers(datex2);
  }
}

function getControllers(datex2: string): DatexFile[] {
  return getTags(datex2, "vmsController")
    .map((controller) => parseController(controller));
}

function getControllerStatuses(datex2: string): DatexFile[] {
  return getTags(datex2, "vmsControllerStatus")
    .map((status) => parseControllerStatus(status));
}

function getSituations(datex2: string): DatexFile[] {
  return getTags(datex2, "situation")
    .map((situation) => parseSituation(situation));
}

function getType(datex2: string): DatexType {
  if (datex2.includes("situationPublication")) {
    return "SITUATION";
  } else if (datex2.includes("VmsPublication")) {
    return "CONTROLLER_STATUS";
  } else if (datex2.includes("VmsTablePublication")) {
    return "CONTROLLER";
  }

  throw new Error("Unknown datex type");
}

function parseController(datex2: string): DatexFile {
  return {
    id: parseId(datex2),
    type: "CONTROLLER",
    datex2,
    effectDate: new Date(),
  };
}

function parseControllerStatus(datex2: string): DatexFile {
  return {
    id: parseId(datex2),
    type: "CONTROLLER_STATUS",
    datex2: datex2,
    effectDate: parseStatusUpdateTime(datex2),
  };
}

function parseSituation(datex2: string): DatexFile {
  return {
    id: parseId(datex2),
    type: "SITUATION",
    datex2,
    effectDate: parseEffectDate(datex2),
  };
}

/// parse statusUpdateTime from vmsControllerStatus
function parseStatusUpdateTime(datex2: string): Date {
  const index = datex2.indexOf(TAGS.STATUS_UPDATE_START) +
    TAGS.STATUS_UPDATE_START.length;
  const index2 = findWithReg(datex2, TAGS.STATUS_UPDATE_END_REGF, index);

  const dateString = datex2.substring(index, index2);

  return new Date(dateString);
}

function parseId(datex2: string): string {
  const startIndex = datex2.indexOf("id=") + 4;
  const index = datex2.indexOf('"', startIndex);
  return datex2.substring(startIndex, index);
}

/// parse overallStartTime from situation
function parseEffectDate(datex2: string): Date {
  const index = datex2.indexOf(TAGS.OVERALL_STARTTIME_START) +
    TAGS.OVERALL_STARTTIME_START.length;
  const index2 = findWithReg(datex2, TAGS.OVERALL_STARTTIME_END_REG, index);

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
