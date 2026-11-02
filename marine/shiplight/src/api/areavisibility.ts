import { logger } from "@digitraffic/common/dist/aws/runtime/logging/dt-logger-default";
import { createKyHooks } from "@digitraffic/common/dist/aws/runtime/logging/http-interceptors";
import { LoggerFactory } from "@digitraffic/common/dist/aws/runtime/logging/http-logger";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import ky from "ky";

export interface AreaVisibilityResponse {
  // ISO 8601
  readonly lastUpdated?: string;
  readonly visibilityInMeters: number;
}

export class AreaVisibilityApi {
  private readonly url: string;
  private readonly token: string;

  private readonly _loggerFactory: LoggerFactory;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
    this._loggerFactory = new LoggerFactory({
      context: "Shiplight",
      urlTemplate: url,
    });
  }

  async getVisibilityForArea(area: string): Promise<AreaVisibilityResponse> {
    const url = `${this.url}/${area}`;
    const httpLogger = this._loggerFactory.logger(url);

    try {
      const resp = await ky.get(url, {
        headers: {
          token: this.token,
          Accept: MediaType.APPLICATION_JSON,
        },
        hooks: createKyHooks(httpLogger),
      });
      if (resp.status !== 200) {
        logger.error({
          method: "AreaVisibilityApi.getVisibilityForArea",
          message: "failed",
          customStatus: resp.status,
        });
        return Promise.reject();
      }
      return resp.json<AreaVisibilityResponse>();
    } catch (_error) {
      throw new Error("Getting visibility for area failed");
    }
  }
}
