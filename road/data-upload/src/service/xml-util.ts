import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { Builder } from "xml2js";

export type IdentityAttribute = {
  "$": {
    id: string;
  };
};

export function findWithReg(
  text: string,
  regex: RegExp,
  startpos: number = 0,
): number {
  const index = text.substring(startpos).search(regex);

  return index >= 0 ? index + startpos : index;
}

export function createXml(object: unknown, rootName: string): string {
  return new Builder({ headless: true, rootName }).buildObject(object);
}

export function getTags(xml: string, tag: string): string[] {
  const tags: string[] = [];
  let index = 0;
  let conIndex = 0;
  let loop = 5;

  // it could be <ns:Tag id=id> or <ns:Tag>
  const reg = new RegExp(`<\\w*:${tag}[\\s>]`);
  const endTag = `${tag}>`;

  do {
    conIndex = findWithReg(xml, reg, index);

    if (conIndex !== -1) {
      const conEndIndex = xml.indexOf(endTag, conIndex + tag.length / 2);

      if (conEndIndex === -1) {
        logger.debug("Can't find end for " + endTag);
        logger.debug(`conIndex ${conIndex}, xml: ${xml}`);

        throw new Error("Cannot find end tag!");
      }

      index = conEndIndex + endTag.length;

      tags.push(xml.substring(conIndex, index));
    }
  } while (conIndex !== -1 && loop-- > 0);

  return tags;
}
