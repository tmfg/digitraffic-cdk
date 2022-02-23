import {withDbSecret} from "digitraffic-common/aws/runtime/secrets/dbsecret";
import * as CountingSitesService from "../../service/counting-sites";
import {LambdaResponse} from "digitraffic-common/aws/types/lambda-response";
import {validate, ValuesQueryParameters} from "../../model/parameters";

const secretId = process.env.SECRET_ID as string;

export const handler = (event: ValuesQueryParameters) => {
    const start = Date.now();

    const validationError = validate(event);
    if (validationError) {
        return Promise.resolve(LambdaResponse.badRequest(validationError));
    }

    const year = event.year as number || new Date().getUTCFullYear();
    const month = event.month as number || new Date().getUTCMonth() + 1;

    const filename = `${year}-${month}.csv`;

    return withDbSecret(secretId, () => {
        return CountingSitesService.getValuesForMonth(year, month, event.domainName, event.counterId).then(data => {
            return LambdaResponse.ok(data, filename);
        }).catch(error => {
            console.info("error " + error);

            return LambdaResponse.internalError();
        }).finally(() => {
            console.info("method=CountingSites.GetCSVData tookMs=%d", (Date.now() - start));
        });
    });
};
