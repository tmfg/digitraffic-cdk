import * as CountingSitesService from "../../service/counting-sites";
import {LambdaResponse} from "digitraffic-common/aws/types/lambda-response";
import {validate, ValuesQueryParameters} from "../../model/parameters";
import {SecretHolder} from "digitraffic-common/aws/runtime/secrets/secret-holder";

const holder = SecretHolder.create();

export const handler = async (event: ValuesQueryParameters) => {
    await holder.setDatabaseCredentials();

    const start = Date.now();

    const validationError = validate(event);
    if (validationError) {
        return Promise.resolve(LambdaResponse.badRequest(validationError));
    }

    return CountingSitesService.findCounterValues(event.year, event.month, event.counterId, event.domainName).then(data => {
        return LambdaResponse.okJson(data);
    }).catch(error => {
        console.info("error " + error);

        return LambdaResponse.internalError();
    }).finally(() => {
        console.info("method=CountingSites.GetData tookMs=%d", (Date.now() - start));
    });
};

