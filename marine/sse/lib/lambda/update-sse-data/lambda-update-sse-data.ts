// import aws from 'aws-sdk';
import {withDbSecret} from "digitraffic-common/aws/runtime/secrets/dbsecret";
import * as SSE from "../../generated/tlsc-sse-reports-schema";
import * as SseUpdateService from "../../service/sse-update-service";
import {BAD_REQUEST_MESSAGE, ERROR_MESSAGE} from "digitraffic-common/aws/types/errors";
import {SseSaveResult} from "../../service/sse-update-service";

export const KEY_SECRET_ID = 'SECRET_ID';

const secretId = process.env[KEY_SECRET_ID] as string;

export const handler: (apiGWRequest: any) => Promise<SseSaveResult> = handlerFn(withDbSecret);

export function handlerFn(withDbSecretFn: (secretId: string, fn: (secret: any) => Promise<void>) => Promise<any>) {
    return async (sseJson: SSE.TheSSEReportRootSchema): Promise<SseSaveResult> => {

        return withDbSecretFn(secretId,  async () : Promise<any> => {
            const start = Date.now();
            const sseJsonStr = JSON.stringify(sseJson);
            console.info(`DEBUG method=updateSseData ${sseJsonStr}`);
            if (!sseJson || !sseJson.SSE_Reports) {
                console.error(`method=updateSseData Empty message content`);
                throw errorJson(BAD_REQUEST_MESSAGE, "Empty message content.");
            }

            try {
                const messageSizeBytes = Buffer.byteLength(sseJsonStr);
                const result = await SseUpdateService.saveSseData(sseJson);

                const end = Date.now();
                console.info(`method=updateSseData sizeBytes=${messageSizeBytes} updatedCount=${result.saved} and failedCount=${result.errors} of count=${sseJson.SSE_Reports.length} tookMs=${(end - start)}`);
                return result;
            } catch (e: any) {
                const end = Date.now();
                console.error(`method=updateSseData Error tookMs=${(end - start)}`, e);
                throw errorJson(ERROR_MESSAGE, `Error while updating sse data: ${e.message}.`);
            }
        });
    };
}

function errorJson(errorMessage : string, detailedMessage : string) : string {
    return JSON.stringify({
        "error" : errorMessage,
        "errorMessage" : detailedMessage,
    });
}