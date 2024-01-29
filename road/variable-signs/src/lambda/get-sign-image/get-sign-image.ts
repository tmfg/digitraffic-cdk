import * as TextConverterService from "../../service/text-converter.js";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { InputError } from "@digitraffic/common/dist/types/input-error";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

/**
 * Update IMPLEMENTATION_LAST_MODIFIED when ever making changes to implementation.
 */
const IMPLEMENTATION_LAST_MODIFIED = new Date("2022-11-24T00:00:00Z");
export const handler = async (event: Record<string, string>): Promise<LambdaResponse> => {
    const start = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const text = event["text"]!;

    try {
        return Promise.resolve(
            LambdaResponse.ok(TextConverterService.convertTextToSvg(text)).withTimestamp(
                IMPLEMENTATION_LAST_MODIFIED
            )
        );
    } catch (e) {
        // bad user input -> 400
        if (e instanceof InputError) {
            return Promise.resolve(LambdaResponse.badRequest(e.message));
        }

        logger.error({
            method: "GetSignImage.handler",
            message: `failed to convert text ${text} to image`,
            error: e
        });

        // other errors -> 500
        return Promise.resolve(LambdaResponse.internalError());
    } finally {
        logger.info({
            method: "GetSignImage.handler",
            message: `convert text: ${text}`,
            tookMs: Date.now() - start
        });
    }
};
