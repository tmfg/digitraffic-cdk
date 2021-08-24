// import aws from 'aws-sdk';
import {withDbSecret} from "digitraffic-common/secrets/dbsecret";
import * as SSE from "../../generated/tlsc-sse-reports-schema"
import * as SseUpdateService from "../../service/sse-update-service"

export const KEY_SECRET_ID = 'SECRET_ID';

const secretId = process.env[KEY_SECRET_ID] as string;

export const handler: (apiGWRequest: any) => Promise<any> = handlerFn(withDbSecret);

export function handlerFn(withDbSecretFn: (secretId: string, fn: (secret: any) => Promise<void>) => Promise<any>) {
    return async (apiGWRequest: any): Promise<any> => {

        return withDbSecretFn(secretId,  async () : Promise<any> => {
            const start = Date.now();
            console.info(`method=updateSseData ${JSON.stringify(apiGWRequest.body)}`);
            if (!apiGWRequest || !apiGWRequest.body) {
                console.error(`method=updateSseData Empty message`);
                return Promise.reject(invalidRequest("Empty message"));
            }

            try {
                const messageSizeBytes = Buffer.byteLength(apiGWRequest.body);
                const sseData : SSE.TheSSEReportRootSchema  = JSON.parse(apiGWRequest.body)
                const count = await SseUpdateService.saveSseData(sseData);

                const end = Date.now();
                console.info(`method=updateSseData sizeBytes=${messageSizeBytes} count=${count} tookMs=${(end - start)}`);
                return Promise.resolve(ok(sseData.SSE_Reports.length));
            } catch (e) {
                console.error(`method=updateSseData Error`, e);
                return Promise.reject(invalidRequest(`Error while updating sse data ${JSON.stringify(e)}`));
            }
        });

    }
}




function invalidRequest(msg: string): object {
    return {
        statusCode: 400,
        body: `Invalid request: ${msg}`
    };
}

function ok(count: number): object {
    return {
        statusCode: 200,
        body: `{ "count": ${count} }`
    };
}
