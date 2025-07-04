import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import ky, { type KyResponse } from "ky";
import type { Feature, Geometry } from "geojson";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export async function getDisruptions(
  endpointUrl: string,
): Promise<DisruptionFeature[]> {
  const start = Date.now();

  const response: KyResponse = await ky.get(endpointUrl, {
    headers: {
      Accept: MediaType.APPLICATION_JSON,
    },
  });

  if (response.status !== 200) {
    logger.error({
      method: "DisruptionsApi.getDisruptions",
      message:
        `Fetching disruptions failed code: ${response.status} details: ${response.statusText}`,
    });
    throw new Error("Fetching disruptions failed");
  }

  const data = await response.json<ApiFeatures>();

  logger.info({
    method: `DisruptionsApi.getDisruptionsFromServer`,
    message: `count=${data.features.length}`,
    tookMs: Date.now() - start,
  });

  return data.features;
}

interface ApiFeatures {
  features: DisruptionFeature[];
}

export type DisruptionFeature = Feature<Geometry, DisruptionProperties>;

export interface DisruptionProperties {
  Id: number;
  Type_Id: number;
  StartDate: string;
  EndDate: string;
  DescriptionFi: string;
  DescriptionSv?: string;
  DescriptionEn?: string;
  geometry: Geometry;
}
