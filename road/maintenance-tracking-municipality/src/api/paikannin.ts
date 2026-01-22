import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { parseISO } from "date-fns";
import ky, { HTTPError } from "ky";
import type {
  ApiDevice,
  ApiWorkeventDevice,
} from "../model/paikannin-api-data.js";
import logger from "../service/maintenance-logger.js";

const URL_DEVICES = "/public/api/devices/all";
const URL_WORKEVENTS = "/public/api/devices/workevents/alldevices";

export class PaikanninApi {
  readonly apikey: string;
  readonly endpointUrl: string;

  /**
   * @param apikey ApiKey for auth
   * @param endpointUrl Enpoint url ie https://mydomain.com
   */
  constructor(apikey: string, endpointUrl: string) {
    this.apikey = apikey;
    this.endpointUrl = endpointUrl;
    logger.info({
      method: `PaikanninApi.constructor`,
      message: `using endpointUrl ${endpointUrl}`,
    });
  }

  /**
   * @param callerMethod to append to log
   * @param url after domain. Ie. /api/contracts
   */
  private async getFromServer<T>(
    callerMethod: string,
    url: string,
  ): Promise<T> {
    const start = Date.now();
    const serverUrl = `${this.endpointUrl}${url}`;
    const method = "PaikanninApi.getFromServer";

    logger.info({
      method,
      message: `${callerMethod} Sending to url ${serverUrl}`,
    });

    return ky
      .get<T>(serverUrl, {
        headers: {
          accept: MediaType.APPLICATION_JSON,
          API_KEY: this.apikey,
        },
      })
      .then((value) => {
        return value.json();
      })
      .catch(async (error: Error | HTTPError) => {
        const isHTTPError = error instanceof HTTPError;
        const message =
          `method=${method} message=${callerMethod} ` +
          (isHTTPError
            ? `GET failed with message: ${error.message}`
            : `GET failed outside ky with message ${error.message}`);
        logger.error({
          method,
          message,
          customCallerMethod: callerMethod,
          customUrl: serverUrl,
          customStatus: isHTTPError ? error.response.status : undefined,
          customResponseData: isHTTPError
            ? await error.response.text()
            : undefined,
          customResponseStatus: isHTTPError
            ? error.response?.status
            : undefined,
          stack: error.stack,
        });
        throw new Error(
          `${message} method=${method} callerMethod=${callerMethod} url=${serverUrl}`,
          {
            cause: error,
          },
        );
      })
      .finally(() => {
        logger.info({
          method,
          message: `${callerMethod} for ${serverUrl}`,
          tookMs: Date.now() - start,
        });
      });
  }

  public getDevices(): Promise<ApiDevice[]> {
    return this.getFromServer<ApiDevice[]>("getDevices", URL_DEVICES);
  }

  public getWorkEvents(
    startTimeInclusive: Date,
    endTimeInclusive: Date,
  ): Promise<ApiWorkeventDevice[]> {
    return this.getFromServer<ApiWorkeventDevice[]>(
      "getWorkEvents",
      `${URL_WORKEVENTS}/${startTimeInclusive.toISOString()}/${endTimeInclusive.toISOString()}`,
    ).then((value) => {
      value.forEach((device) => {
        // Convert string to Date
        device.workEvents.forEach((event) => {
          if (event.timest) {
            event.timestamp = parseISO(event.timest);
          }
        });
      });
      return value;
    });
  }
}
