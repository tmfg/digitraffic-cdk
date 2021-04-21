import axios from 'axios';
import {withSecret} from "../../../../../common/secrets/secret";

export const KEY_SECRET_ID = 'SECRET_ID';
export const KEY_SCHEDULES_TOKEN_SECRETKEY = 'SCHEDULES_TOKEN_SECRETKEY'
export const KEY_SCHEDULES_URL_SECRETKEY = 'SCHEDULES_URL_SECRETKEY';

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
        const resp = await axios.get(`${url}?imo=${event.queryStringParameters.imo}`);
        return {
            statusCode: 200,
            body: resp.data
        }
    });
}
