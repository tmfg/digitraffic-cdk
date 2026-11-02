import { logger } from "@digitraffic/common/dist/aws/runtime/logging/dt-logger-default";
import { createKyHooks } from "@digitraffic/common/dist/aws/runtime/logging/http-interceptors";
import { LoggerFactory } from "@digitraffic/common/dist/aws/runtime/logging/http-logger";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import ky from "ky";
import type { FaultFeature } from "../model/fault.js";

interface ApiFeatures {
  readonly features: FaultFeature[];
}

export class FaultsApi {
  private readonly endpointUrl: string;
  readonly _loggerFactory: LoggerFactory;

  constructor(endpointUrl: string) {
    this.endpointUrl = endpointUrl;

    this._loggerFactory = new LoggerFactory({
      context: "Aton-faults",
      urlTemplate: endpointUrl,
    });
  }

  public async getFaults(): Promise<FaultFeature[]> {
    const httpLogger = this._loggerFactory.logger(this.endpointUrl);

    return ky
      .get(this.endpointUrl, {
        timeout: 10000,
        headers: {
          Accept: MediaType.APPLICATION_JSON,
        },
        hooks: createKyHooks(httpLogger),
      })
      .then(async (resp) => {
        if (resp.status !== 200) {
          logger.error({
            method: "FaultsApi.getFaults",
            message: "Fetching faults failed",
            customDetails: resp.statusText,
          });

          return [];
        }

        const features = await resp.json<ApiFeatures>();

        return features.features;
      })
      .catch((_error) => {
        return [];
      });
  }
}
