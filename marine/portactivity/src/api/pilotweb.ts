import { createKyHooks } from "@digitraffic/common/dist/aws/runtime/logging/http-interceptors";
import ky from "ky";
import { loggerFactory } from "../logging.js";

const PILOTAGES_PATH = "/digitraffic/pilotages/active";
export function getMessages(host: string, authHeader: string): Promise<string> {
  const url = `https://${host}${PILOTAGES_PATH}`;
  const httpLogger = loggerFactory.logger(url, PILOTAGES_PATH);

  return ky
    .get(url, {
      headers: {
        Authorization: `Basic ${authHeader}`,
        Accept: "application/json",
      },
      hooks: createKyHooks(httpLogger),
    })
    .text();
}
