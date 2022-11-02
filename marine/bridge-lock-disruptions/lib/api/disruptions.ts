import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import axios from "axios";
import { Feature, Geometry } from "geojson";

export async function getDisruptions(
    endpointUrl: string
): Promise<DisruptionFeature[]> {
    const resp = await getDisruptionsFromServer(endpointUrl);
    if (resp.status !== 200) {
        console.error("Fetching disruptions failed: %s", resp.statusText);
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

export function getDisruptionsFromServer(url: string) {
    const start = Date.now();
    return axios
        .get<ApiFeatures>(url, {
            headers: {
                Accept: MediaType.APPLICATION_JSON,
            },
        })
        .then((a) => {
            const end = Date.now();
            console.info(
                "method=getDisruptionsFromServer disruptionCount=%d tookMs=%d",
                a.data.features.length,
                end - start
            );
            return a;
        });
}
