import * as CountingSitesService from "../../service/counting-sites";
import {LambdaResponse} from "@digitraffic/common/aws/types/lambda-response";
import {validate, ValuesQueryParameters} from "../../model/parameters";
import {ProxyHolder} from "@digitraffic/common/aws/runtime/secrets/proxy-holder";

const proxyHolder = ProxyHolder.create();

export const handler = (event: ValuesQueryParameters) => {
    const start = Date.now();

    const validationError = validate(event);
    if (validationError) {
        return LambdaResponse.badRequest(validationError);
    }

    return proxyHolder.setCredentials()
        .then(() => CountingSitesService.findCounterValues(event.year, event.month, event.counterId, event.domainName))
        .then(data => {
            return LambdaResponse.okJson(data);
        }).catch(error => {
            console.info("error " + error);

            return LambdaResponse.internalError();
        }).finally(() => {
            console.info("method=CountingSites.GetData tookMs=%d", (Date.now() - start));
        });
};

