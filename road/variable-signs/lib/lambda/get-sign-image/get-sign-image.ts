import * as TextConverterService from "../../service/text-converter";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { InputError } from "@digitraffic/common/dist/types/input-error";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

/**
 * Update IMPLEMENTATION_LAST_MODIFIED when ever making changes to implementation.
 */
const IMPLEMENTATION_LAST_MODIFIED = new Date("2022-11-24T00:00:00Z");
export const handler = (event: Record<string, string>): LambdaResponse => {
    const start = Date.now();
    const text = event.text;

    try {
        return LambdaResponse.ok(TextConverterService.convertTextToSvg(text)).withTimestamp(
            IMPLEMENTATION_LAST_MODIFIED
        );
    } catch (e) {
        // bad user input -> 400
        if (e instanceof InputError) {
            return LambdaResponse.badRequest(e.message);
        }

        // other errors -> 500
        return LambdaResponse.internalError();
    } finally {
        logger.info({
            method: "GetSignImage.handler",
            tookMs: Date.now() - start
        });
    }
};
