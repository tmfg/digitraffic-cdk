import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { Agent, request } from "undici";
import type { NemoResponse } from "../model/nemo.js";

export class NemoApi {
  readonly _url: string;
  readonly _certificate: string;
  readonly _privateKey: string;

  constructor(url: string, privateKey: string, certificate: string) {
    this._url = url;
    this._certificate = certificate;
    this._privateKey = privateKey;
  }

  async getVisits(from: Date, to: Date): Promise<NemoResponse> {
    const method = "NemoApi.getVisits";
    const url = this.createUrl(from, to);

    logger.info({
      method,
      message: `Getting visits from ${url}`,
    });

    try {
      const resp = await request(url, {
        method: "GET",
        headers: {
          "user-agent": "Digitraffic/undici",
        },
        dispatcher: new Agent({
          connect: {
            cert: this._certificate,
            key: this._privateKey,
          },
        }),
      });

      if (resp.statusCode !== 200) {
        logger.debug("error " + JSON.stringify(resp));

        logger.error({
          method,
          customStatus: resp.statusCode,
          customErrorCount: 1,
        });

        return Promise.reject();
      }

      const response = (await resp.body.json()) as NemoResponse;

      logger.debug("returning " + JSON.stringify(response));

      return Promise.resolve(response);
    } catch (error) {
      logger.debug("error " + JSON.stringify(error));

      //            logException(logger, error);

      return Promise.reject();
    }
  }

  createUrl(from: Date, to: Date): string {
    return `${this._url}/${this.getDate(from)}/${this.getDate(to)}`;
  }

  // get wanted format
  // 2025-03-25T08:28:09.681Z --> 2025-03-25T08:28:09Z
  getDate(time: Date): string {
    return time.toISOString().slice(0, -5) + "Z";
  }
}
