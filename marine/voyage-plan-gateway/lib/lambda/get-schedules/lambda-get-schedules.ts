import axios from 'axios';
import {withSecret} from "../../../../../common/secrets/secret";
import {KEY_SCHEDULES_TOKEN_SECRETKEY, KEY_SCHEDULES_URL_SECRETKEY, KEY_SECRET_ID} from "./env_keys";

const secretId = process.env[KEY_SECRET_ID] as string;
const schedulesTokenSecretKey = process.env[KEY_SCHEDULES_TOKEN_SECRETKEY] as string;
const schedulesUrlSecretKey = process.env[KEY_SCHEDULES_URL_SECRETKEY] as string;

export async function handler(event: any): Promise<any> {
    return await withSecret(secretId, async (secret: any) => {
        if (event.queryStringParameters.auth != secret[schedulesTokenSecretKey]) {
            return {
                statusCode: 403,
                body: 'Denied'
            }
        }
        let url = secret[schedulesUrlSecretKey];
        const calculated = event.queryStringParameters.calculated == 'true';
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