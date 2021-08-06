import {MonitoredApp} from "../app-props";
import axios from "axios";
import {AppEndpoints} from "../model/app-endpoints";

export class DigitrafficApi {

    async getAppEndpoints(app: MonitoredApp): Promise<AppEndpoints> {
        console.log('Fetching digitraffic endpoints')
        const resp = await axios.get(app.url, {
            headers: {
                'accept-encoding': 'gzip'
            }
        });
        if (resp.status !== 200) {
            throw new Error('Unable to fetch contacts');
        }
        console.log('..done');
        const all = Object.keys(resp.data.paths).filter(p => !p.includes('{'));
        const notBeta = all.filter((e) => !e.includes('beta'));
        const beta = all.filter((e) => e.includes('beta'));
        notBeta.sort();
        beta.sort();
        return {
            app: app.name,
            hostPart: app.hostPart,
            endpoints: (([] as string[]).concat(notBeta).concat(beta)).filter(e => !app.excluded.includes(e)),
            extraEndpoints: app.endpoints
        };
    }

}
