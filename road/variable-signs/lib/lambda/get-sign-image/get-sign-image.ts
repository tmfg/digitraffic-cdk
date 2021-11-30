import * as TextConverterService from "../../service/text-converter";
import {LambdaResponse} from "digitraffic-common/lambda/lambda-response";
import {InputError} from "digitraffic-common/error/input-error";

export const handler = async (event: Record<string, string>) => {
    const start = Date.now();
    const text = event["text"] as string;

    try {
        return LambdaResponse.ok(TextConverterService.convertTextToSvg(text));
    } catch(e) {
        // bad user input -> 400
        if(e instanceof InputError) {
            return LambdaResponse.bad_request(e.message);
        }

        // other errors -> 500
        return LambdaResponse.internal_error();
    } finally {
        console.info("method=getSignImageLambda tookMs=%d", (Date.now()-start));
    }
};
