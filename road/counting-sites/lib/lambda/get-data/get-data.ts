import {withDbSecret} from "digitraffic-common/aws/runtime/secrets/dbsecret";
import * as CountingSitesService from "../../service/counting-sites";
import {LambdaResponse} from "digitraffic-common/aws/types/lambda-response";
import {validate, ValuesQueryParameters} from "../../model/parameters";

const secretId = process.env.SECRET_ID as string;

export const handler = (event: ValuesQueryParameters) => {
    return withDbSecret(secretId, () => {
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
    });
};

