import {
    BAD_REQUEST_MESSAGE,
    ERROR_MESSAGE,
} from "@digitraffic/common/dist/aws/types/errors";
import * as SSE from "../../generated/tlsc-sse-reports-schema";
import * as SseUpdateService from "../../service/sse-update-service";
import { SseSaveResult } from "../../service/sse-update-service";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";

const rdsHolder = RdsHolder.create();

export async function handler(
    apiGWRequest: SSE.TheSSEReportRootSchema | undefined
): Promise<SseSaveResult> {
    const start = Date.now();

    if (!apiGWRequest || !apiGWRequest.SSE_Reports) {
        console.error("method=updateSseData Empty message content");
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw errorJson(BAD_REQUEST_MESSAGE, "Empty message content.");
    }

    try {
        const sseJsonStr = JSON.stringify(apiGWRequest);
        console.info(`DEBUG method=handler ${sseJsonStr}`);

        const messageSizeBytes = Buffer.byteLength(sseJsonStr);

        await rdsHolder.setCredentials();
        const result = await SseUpdateService.saveSseData(
            apiGWRequest.SSE_Reports
        );

        const end = Date.now();
        console.info(
            `method=updateSseData sizeBytes=${messageSizeBytes} updatedCount=${
                result.saved
            } and failedCount=${result.errors} of count=${
                apiGWRequest.SSE_Reports.length
            } tookMs=${end - start}`
        );
        return result;
    } catch (e) {
        const end = Date.now();
        console.error(
            `method=updateSseData Error tookMs=${
                end - start
            } data: ${JSON.stringify(apiGWRequest)}`,
            e
        );
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw errorJson(
            ERROR_MESSAGE,
            `Error while updating sse data. Error ${JSON.stringify(e)}`
        );
    }
}

function errorJson(errorMessage: string, detailedMessage: string): string {
    return JSON.stringify({
        error: errorMessage,
        errorMessage: detailedMessage,
    });
}
