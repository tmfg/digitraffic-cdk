import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import axios, { AxiosResponse } from "axios";
import { Feature, Geometry } from "geojson";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export async function getDisruptions(endpointUrl: string): Promise<DisruptionFeature[]> {
    const resp = await getDisruptionsFromServer(endpointUrl);
    if (resp.status !== 200) {
        logger.error({
            method: "DisruptionsApi.getDisruptions",
            message: `Fetching disruptions failed code: ${resp.status} details: ${resp.statusText}`
        });
        throw new Error("Fetching disruptions failed");
    }
    return resp.data.features;
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

export function getDisruptionsFromServer(url: string): Promise<AxiosResponse<ApiFeatures>> {
    const start = Date.now();
    return axios
        .get<ApiFeatures>(url, {
            headers: {
                Accept: MediaType.APPLICATION_JSON
            }
        })
        .then((a) => {
            logger.info({
                method: `DisruptionsApi.getDisruptionsFromServer`,
                message: `count=${a.data.features.length}`,
                tookMs: Date.now() - start
            });

            return a;
        });
}
