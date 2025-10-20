import type { DatexFile, DatexType } from "./variable-signs.js";
import { createXml, type IdentityAttribute } from "./xml-util.js";
import { parseStringPromise } from "xml2js";

interface SituationRecord {
  "validity": {
    validityTimeSpecification: {
      overallStartTime: Date[];
    }[];
  }[];
}

interface Situation extends IdentityAttribute {
  "situationRecord": SituationRecord[];
}

interface SituationPublication {
  "situation": Situation[];
}

interface VmsControllerStatus {
  vmsControllerReference: IdentityAttribute[];

  "statusUpdateTime": Date[];
}

interface VmsController extends IdentityAttribute {
}
interface VmsControllerTable {
  vmsController: VmsController[];
}

interface Datex35File {
  "sit:situationPublication": SituationPublication;
  "d2:payload": {
    "$": {
      "xsi:type": string;
    };
    "vmsControllerStatus": VmsControllerStatus[];
    "vmsControllerTable": VmsControllerTable[];
  };
}

export async function parseDatex(datex2: string): Promise<DatexFile[]> {
  const xml = await parseStringPromise(datex2) as Datex35File;

  // eslint-disable-next-line
  //  console.debug("xml " + JSON.stringify(xml));

  switch (getType(xml)) {
    case "SITUATION":
      return getSituations(xml["sit:situationPublication"]);
    case "CONTROLLER_STATUS":
      return getControllerStatus(
        xml["d2:payload"].vmsControllerStatus,
      );
    case "CONTROLLER":
      return getControllers(xml["d2:payload"].vmsControllerTable);
  }
}

function getControllers(controllerTable: VmsControllerTable[]): DatexFile[] {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return controllerTable[0]!.vmsController.map(parseController);
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

  const payload = datex2["d2:payload"];
  const type = payload.$["xsi:type"];

  if (type === "vms:VmsPublication") {
    return "CONTROLLER_STATUS";
  } else if (type === "vms:VmsTablePublication") {
    return "CONTROLLER";
  }

  throw new Error(`Unknown datex type ${type}`);
}

function parseController(controller: VmsController): DatexFile {
  const id = controller.$.id;
  const type = "CONTROLLER";
  const datex2 = createXml(controller, "vmsController");
  const effectDate = new Date();

  return { id, type, datex2, effectDate };
}

function parseControllerStatus(status: VmsControllerStatus): DatexFile {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const id = status.vmsControllerReference[0]!.$.id;
  const type = "CONTROLLER_STATUS";
  const datex2 = createXml(status, "vmsControllerStatus");

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const effectDate = status.statusUpdateTime[0]!;

  return { id, type, datex2, effectDate };
}

function parseSituation(situation: Situation): DatexFile {
  const id = situation.$.id;
  const type = "SITUATION";
  const datex2 = createXml(situation, "situation");
  const effectDate = getEffectDate(situation);

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
