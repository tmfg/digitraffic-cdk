// import aws from 'aws-sdk';
import {withDbSecret} from "digitraffic-common/secrets/dbsecret";
import * as SSE from "../../generated/tlsc-sse-reports-schema"
import * as SseUpdateService from "../../service/sse-update-service"
import {BAD_REQUEST_MESSAGE, ERROR_MESSAGE} from "digitraffic-common/api/errors";

export const KEY_SECRET_ID = 'SECRET_ID';

const secretId = process.env[KEY_SECRET_ID] as string;

export const handler: (apiGWRequest: any) => Promise<any> = handlerFn(withDbSecret);

export function handlerFn(withDbSecretFn: (secretId: string, fn: (secret: any) => Promise<void>) => Promise<any>) {
    return async (sseJson: SSE.TheSSEReportRootSchema): Promise<any> => {

        return withDbSecretFn(secretId,  async () : Promise<any> => {
            const start = Date.now();
            const sseJsonStr = JSON.stringify(sseJson);
            console.info(`DEBUG method=updateSseData ${sseJsonStr}`);
            if (!sseJson || !sseJson.SSE_Reports) {
                console.error(`method=updateSseData Empty message content`);
                return Promise.reject(errorJson(BAD_REQUEST_MESSAGE, "Empty message content."));
            }

            try {
                const messageSizeBytes = Buffer.byteLength(sseJsonStr);
                const count = await SseUpdateService.saveSseData(sseJson);

                const end = Date.now();
                console.info(`method=updateSseData sizeBytes=${messageSizeBytes} updatedCount=${count} of count=${sseJson.SSE_Reports.length} tookMs=${(end - start)}`);
                return Promise.resolve({count: count})
            } catch (e) {
                const end = Date.now();
                console.error(`method=updateSseData Error tookMs=${(end - start)}`, e);
                return Promise.reject(errorJson(ERROR_MESSAGE, `Error while updating sse data: ${e.message}.`));
            }
        });
    }
}

function errorJson(errorMessage : String, detailedMessage : String) : String {
    return JSON.stringify({
        "error" : errorMessage,
        "errorMessage" : detailedMessage
    })
}