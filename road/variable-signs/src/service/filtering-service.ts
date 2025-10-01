import { parseXml, XmlElement } from "@rgrove/parse-xml";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export const TEST_DEVICES = new Set<string>([
  "VME/TIO01K502",
  "VME/TIO01K500",
  "VME/TIO015111",
  "VME/TIO015152",
]);

export const TEST_TIMES = [
  {
    start: new Date("2024-05-20T19:00:00.00Z"),
    end: new Date("2024-05-21T02:00:00.00Z"),
  },
  {
    start: new Date("2024-05-21T19:00:00.00Z"),
    end: new Date("2024-05-22T02:00:00.00Z"),
  },
] as const;

function getChild(
  element: XmlElement,
  name: string,
): XmlElement {
  for (const child of element.children) {
    if (child instanceof XmlElement && child.name.includes(name)) {
      return child;
    }
  }

  throw new Error("Missing element " + name);
}

function isTestTime(time: Date): boolean {
  const timeMs = time.getTime();

  return TEST_TIMES.find((tt) =>
    tt.start.getTime() <= timeMs && tt.end.getTime() > timeMs
  ) !== undefined;
}

export function isProductionMessage(datex2: string): boolean {
  try {
    const xml = parseXml(datex2).root;

    if (!xml) {
      logger.error({
        method: "FilteringService.isProductionMessage",
        message: "empty xml root!",
      });

      return true;
    }

    const situationRecord = getChild(xml, "situationRecord");

    // check if the device is test device
    // eslint-disable-next-line dot-notation
    if (!TEST_DEVICES.has(situationRecord.attributes["id"] || "")) {
      return true;
    }

    const validity = getChild(situationRecord, "validity");
    const validityTimeSpecification = getChild(
      validity,
      "validityTimeSpecification",
    );
    const overallStartTime = getChild(
      validityTimeSpecification,
      "overallStartTime",
    );

    return !isTestTime(new Date(overallStartTime.text));
  } catch (t) {
    logger.debug("some error from " + datex2);

    logger.error({
      method: "FilteringService.isProductionMessage",
      message: "Error",
      error: (t as Error).message,
    });
  }

  return true;
}
