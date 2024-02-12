import { BAD_REQUEST_MESSAGE, ERROR_MESSAGE } from "@digitraffic/common/dist/aws/types/errors";
import type * as SSE from "../../generated/tlsc-sse-reports-schema.d.ts";
import * as SseUpdateService from "../../service/sse-update-service.js";
import type { SseSaveResult } from "../../service/sse-update-service.js";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const rdsHolder = RdsHolder.create();

export async function handler(apiGWRequest: SSE.TheSSEReportRootSchema | undefined): Promise<SseSaveResult> {
    const start = Date.now();

    if (!apiGWRequest || !apiGWRequest.SSE_Reports) {
        logger.error({
            method: "lambda-update-sse-data.handler",
            message: "Empty message content"
        });
        throw errorJson(BAD_REQUEST_MESSAGE, "Empty message content.");
    }

    try {
        const sseJsonStr = JSON.stringify(apiGWRequest);
        logger.debug({
            method: "lambda-update-sse-data.handler",
            message: `${sseJsonStr}`
        });

        const messageSizeBytes = Buffer.byteLength(sseJsonStr);

        await rdsHolder.setCredentials();
        const result = await SseUpdateService.saveSseData(apiGWRequest.SSE_Reports);

        const end = Date.now();
        logger.info({
            method: "lambda-update-sse-data.handler",
            customSizeBytes: messageSizeBytes,
            customUpdatedCount: result.saved,
            customFailedCount: result.errors,
            customTotalCount: apiGWRequest.SSE_Reports.length,
            customTookMs: end - start
        });
        return result;
    } catch (e) {
        const end = Date.now();
        logger.error({
            method: "lambda-update-sse-data.handler",
            error: e,
            customTookMs: end - start,
            customData: JSON.stringify(apiGWRequest)
        });
        throw errorJson(ERROR_MESSAGE, `Error while updating sse data. Error ${JSON.stringify(e)}`);
    }
}

function errorJson(errorMessage: string, detailedMessage: string): string {
    return JSON.stringify({
        error: errorMessage,
        errorMessage: detailedMessage
    });
}
