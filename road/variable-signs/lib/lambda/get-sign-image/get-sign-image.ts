import * as TextConverterService from "../../service/text-converter";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { InputError } from "@digitraffic/common/types/input-error";

export const handler = (event: Record<string, string>) => {
    const start = Date.now();
    const text = event.text;

    try {
        return LambdaResponse.ok(TextConverterService.convertTextToSvg(text));
    } catch (e) {
        // bad user input -> 400
        if (e instanceof InputError) {
            return LambdaResponse.badRequest(e.message);
        }

        // other errors -> 500
        return LambdaResponse.internalError();
    } finally {
        console.info("method=getSignImageLambda tookMs=%d", Date.now() - start);
    }
};
