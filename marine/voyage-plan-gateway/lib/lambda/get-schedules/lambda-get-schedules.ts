import axios from 'axios';
import {withSecret} from "digitraffic-common/secrets/secret";
import {VoyagePlanEnvKeys, VoyagePlanSecretKeys} from "../../keys";

const secretId = process.env[VoyagePlanEnvKeys.SECRET_ID] as string;

export async function handler(event: any): Promise<any> {
    return await withSecret(secretId, async (secret: any) => {
        if (event.queryStringParameters.auth !== secret[VoyagePlanSecretKeys.SCHEDULES_ACCESS_TOKEN]) {
            return {
                statusCode: 403,
                body: 'Denied'
            }
        }
        let url = secret[VoyagePlanSecretKeys.SCHEDULES_URL];
        const calculated = event.queryStringParameters.calculated === 'true';
        if (calculated) {
            url += '/calculated';
        }

        const params: string[] = [];
        handleQueryParam('name', event.queryStringParameters, params);
        handleQueryParam('callsign', event.queryStringParameters, params);
        handleQueryParam('imo', event.queryStringParameters, params);
        handleQueryParam('mmsi', event.queryStringParameters, params);
        handleQueryParam('uuid', event.queryStringParameters, params);
        handleQueryParam('locode', event.queryStringParameters, params);
        handleQueryParam('externalID', event.queryStringParameters, params);

        const fullUrl = url + (params.length ? '?' : '') + params.join('&');
        const resp = await axios.get(fullUrl);
        return {
            statusCode: 200,
            body: resp.data
        }
    });
}

function handleQueryParam(param: string, queryParams: any, params: string[]) {
    if (queryParams[param]) {
        params.push(`${param}=${queryParams[param]}`);
    }
}
