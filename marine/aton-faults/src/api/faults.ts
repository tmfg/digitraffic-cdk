import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { logException } from "@digitraffic/common/dist/utils/logging";
import ky from "ky";
import type { FaultFeature } from "../model/fault.js";

interface ApiFeatures {
  readonly features: FaultFeature[];
}

export class FaultsApi {
  private readonly endpointUrl: string;

  constructor(endpointUrl: string) {
    this.endpointUrl = endpointUrl;
  }

  public async getFaults(): Promise<FaultFeature[]> {
    const start = Date.now();

    return ky
      .get(this.endpointUrl, {
        timeout: 10000,
        headers: {
          Accept: MediaType.APPLICATION_JSON,
        },
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

        const end = Date.now();
        logger.info({
          method: "FaultsApi.getFaults",
          tookMs: end - start,
          customFaultCount: features.features.length,
        });

        return features.features;
      })
      .catch((error) => {
        logException(logger, error);

        return [];
      });
  }
}
