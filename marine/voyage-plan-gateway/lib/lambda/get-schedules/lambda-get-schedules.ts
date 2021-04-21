import axios from 'axios';
import {withSecret} from "../../../../../common/secrets/secret";

export const KEY_SECRET_ID = 'SECRET_ID';

const secretId = process.env[KEY_SECRET_ID] as string;

export async function handler(event: any): Promise<any> {
    return await withSecret(secretId, async (secret: any) => {
        if (event.queryStringParameters.auth != secret['vpgw.schedulesAccessToken']) {
            return {
                statusCode: 403,
                body: 'Denied'
            }
        }
        let url = secret['vpgw.schedulesUrl'];
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
