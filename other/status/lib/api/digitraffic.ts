import { MonitoredApp } from "../app-props";
import axios from "axios";
import { AppEndpoints } from "../model/app-endpoints";

const BETA = "beta";

interface EndpointResponse {
    paths: string[];
}

export class DigitrafficApi {
    async getAppEndpoints(app: MonitoredApp): Promise<AppEndpoints> {
        console.log("Fetching digitraffic endpoints");
        const resp = await axios.get<EndpointResponse>(app.url, {
            headers: {
                "accept-encoding": "gzip",
            },
        });
        if (resp.status !== 200) {
            throw new Error("Unable to fetch contacts");
        }
        console.log("..done");
        const all = Object.keys(resp.data.paths).filter(
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
