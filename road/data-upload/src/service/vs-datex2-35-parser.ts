import type { DatexFile, DatexType } from "./variable-signs.js";
import { getTags } from "./xml-util.js";
import { Builder, type ParserOptions, parseStringPromise } from "xml2js";

const TAGS = {
  OVERALL_STARTTIME_START: "overallStartTime>",
  OVERALL_STARTTIME_END_REG: /<\/.*overallStartTime>/,
  STATUS_UPDATE_START: "statusUpdateTime>",
  STATUS_UPDATE_END_REGF: /<\/.*statusUpdateTime>/,
} as const;

interface SituationRecord {
  "validity": {
    validityTimeSpecification: {
      overallStartTime: Date[];
    }[];
  }[];
}

interface Situation {
  "$": {
    id: string;
  };
  "situationRecord": SituationRecord[];
}

interface SituationPublication {
  "situation": Situation[];
}

interface VmsControllerStatus {
  "$": {
    id: string;
  };
  "ns11:statusUpdateTime": Date[];
}

interface Datex35File {
  "sit:situationPublication": SituationPublication;
  "ns15:payload": {
    "$": {
      "xsi:type": string;
    };
    "ns11:vmsControllerStatus": VmsControllerStatus[];
  };
}

export async function parseDatex(datex2: string): Promise<DatexFile[]> {
  const xml = await parseStringPromise(datex2) as Datex35File;

  // eslint-disable-next-line
  console.debug("xml " + JSON.stringify(xml));

  switch (getType(xml)) {
    case "SITUATION":
      return getSituations(xml["sit:situationPublication"]);
    case "CONTROLLER_STATUS":
      return getControllerStatus(
        xml["ns15:payload"]["ns11:vmsControllerStatus"],
      );
    case "CONTROLLER":
      return getControllers(datex2);
  }
}

function getControllers(datex2: string): DatexFile[] {
  return getTags(datex2, "vmsController")
    .map((controller) => parseController(controller));
}

function getControllerStatus(statuses: VmsControllerStatus[]): DatexFile[] {
  return statuses.map(parseControllerStatus);
}

function getSituations(publication: SituationPublication): DatexFile[] {
  return publication.situation.map(parseSituation);
}

function getType(datex2: Datex35File): DatexType {
  if (!datex2) {
    throw new Error("unknown datex type");
  }

  if (datex2["sit:situationPublication"]) {
    return "SITUATION";
  }

  const payload = datex2["ns15:payload"];
  const type = payload.$["xsi:type"];

  if (type === "ns12:VmsPublication") {
    return "CONTROLLER_STATUS";
  } else if (type === "ns11:VmsTablePublication") {
    return "CONTROLLER";
  }

  throw new Error("Unknown datex type " + type);
}

function parseController(datex2: string): DatexFile {
  return {
    id: parseId(datex2),
    type: "CONTROLLER",
    datex2,
    effectDate: new Date(),
  };
}

function parseControllerStatus(status: VmsControllerStatus): DatexFile {
  const id = status.$.id;
  const type = "CONTROLLER_STATUS";
  const datex2 = new Builder({
    headless: true,
    rootName: "ns11:vmsControllerStatus",
  }).buildObject(status);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const effectDate = status["ns11:statusUpdateTime"][0]!;

  return { id, type, datex2, effectDate };
}

function parseSituation(situation: Situation): DatexFile {
  const id = situation.$.id;
  const type = "SITUATION";
  const datex2 = new Builder({ headless: true, rootName: "ns3:situation" })
    .buildObject(situation);
  const effectDate = getEffectDate(situation);

  // eslint-disable-next-line
  console.debug("generated xml " + datex2);

  return { id, type, datex2, effectDate };
}

function getEffectDate(situation: Situation): Date {
  const record = situation.situationRecord[0];

  if (record) {
    const validity = record.validity[0];

    if (validity) {
      const specification = validity.validityTimeSpecification[0];

      if (specification) {
        const time = specification.overallStartTime[0];

        if (time) {
          return time;
        }
      }
    }
  }

  return new Date();
}

function parseId(datex2: string): string {
  const startIndex = datex2.indexOf("id=") + 4;
  const index = datex2.indexOf('"', startIndex);
  return datex2.substring(startIndex, index);
}
