import * as util from "util";
import * as xml2js from "xml2js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import ky from "ky";

export async function getXml<T>(
  endpointUser: string,
  endpointPass: string,
  endpointUrl: string,
  path: string,
): Promise<T> {
  const credentials = Buffer.from(`${endpointUser}:${endpointPass}`).toString(
    "base64",
  );

  const resp = await ky.get<string>(`${endpointUrl}${path}`, {
    headers: {
      Accept: "application/xml",
      Authorization: `Basic ${credentials}`,
    },
  });

  if (resp.status !== 200) {
    logger.error({
      method: "open311ApiXMLApiUtils.getXml",
      message: `Query to ${path} failed status ${resp.status}`,
    });
    throw Error(`Query to ${path} failed`);
  }

  const parse = util.promisify(xml2js.parseString);
  return (await parse(await resp.text())) as T;
}
