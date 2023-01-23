import { MonitoredApp } from "../app-props";
import axios from "axios";
import { AppEndpoints } from "../model/app-endpoints";

const BETA = "beta";

interface EndpointResponse {
    paths: string[];
}

/**
 * Get endpoints form OpenApi spesification (OpenAPI Specification)
 */
export class DigitrafficApi {
    async getAppEndpoints(app: MonitoredApp): Promise<AppEndpoints> {
        console.log(
            `method=getAppEndpoints Fetching digitraffic endpoints for ${app.name} from ${app.url}`
        );
        // Swagger url
        const resp = await axios.get<EndpointResponse>(app.url, {
            headers: {
                "accept-encoding": "gzip",
            },
        });
        if (resp.status !== 200) {
            throw new Error(
                `method=getAppEndpoints Unable to fetch enpoints from ${app.url}`
            );
        }
        console.log(`method=getAppEndpoints done for ${app.name}`);
        const all = Object.keys(resp.data.paths).filter(
            // Filter all api paths that needs path-parameter
            (p) => !p.includes("{")
        );
        const notBeta = all.filter((e) => !e.includes(BETA));
        const beta = all.filter((e) => e.includes(BETA));
        notBeta.sort();
        beta.sort();
        return {
            app: app.name,
            hostPart: app.hostPart,
            endpoints: ([] as string[])
                .concat(notBeta)
                .concat(beta)
                .filter((e) => !app.excluded.includes(e)),
            extraEndpoints: app.endpoints,
        };
    }
}
