import { logger } from "@digitraffic/common/dist/aws/runtime/logging/dt-logger-default";
import { LoggerFactory } from "@digitraffic/common/dist/aws/runtime/logging/http-logger";
import { Agent, request } from "undici";
import type { NemoResponse } from "../model/nemo.js";
import { nemoVisitSchema } from "../model/nemo.js";

export class NemoApi {
  readonly _url: string;
  readonly _certificate: string;
  readonly _privateKey: string;

  readonly _loggerFactory: LoggerFactory;

  constructor(url: string, privateKey: string, certificate: string) {
    this._url = url;
    this._certificate = certificate;
    this._privateKey = privateKey;
    this._loggerFactory = new LoggerFactory({
      context: "Port-call",
      urlTemplate: this.createTemplate(),
    });
  }

  async getVisits(from: Date, to: Date): Promise<NemoResponse> {
    const method = "NemoApi.getVisits";
    const url = this.createUrl(from, to);
    const httpLogger = this._loggerFactory.logger(url);

    try {
      const resp = await request(new URL(url), {
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

      httpLogger.log(resp);

      if (resp.statusCode !== 200) {
        const responseBody = await resp.body.text();

        logger.error({
          method,
          customStatus: resp.statusCode,
          customErrorCount: 1,
          customResponsePreview: responseBody.slice(0, 1000),
        });

        throw new Error(
          `NEMO getVisits failed with status ${resp.statusCode}: ${responseBody.slice(0, 1000)}`,
        );
      }

      const response = this.convertResponse(await resp.body.json());

      logger.debug(`returning ${JSON.stringify(response)}`);

      return response;
    } catch (error) {
      logger.debug(`error ${JSON.stringify(error)}`);

      throw error;
    }
  }

  convertResponse(response: unknown): NemoResponse {
    const parseResponse = nemoVisitSchema.array().safeParse(response);

    if (!parseResponse.success) {
      logger.debug(`Got message ${JSON.stringify(response)}`);

      logger.error({
        message: `Invalid response format: ${JSON.stringify(parseResponse.error)}`,
        method: "NemoApi.convertResponse",
      });
    }

    return response as NemoResponse;
  }

  createUrl(from: Date, to: Date): string {
    return `${this._url}/${this.getDate(from)}/${this.getDate(to)}`;
  }

  createTemplate(): string {
    return `${this._url}/{date}/{date}`;
  }

  // get wanted format
  // 2025-03-25T08:28:09.681Z --> 2025-03-25T08:28:09Z
  getDate(time: Date): string {
    return `${time.toISOString().slice(0, -5)}Z`;
  }
}
