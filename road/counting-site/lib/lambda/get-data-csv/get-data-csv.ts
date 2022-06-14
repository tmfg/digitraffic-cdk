import * as CountingSitesService from "../../service/counting-sites";
import {LambdaResponse} from "digitraffic-common/aws/types/lambda-response";
import {validate, ValuesQueryParameters} from "../../model/parameters";
import {ProxyHolder} from "digitraffic-common/aws/runtime/secrets/proxy-holder";

const proxyHolder = ProxyHolder.create();

export const handler = (event: ValuesQueryParameters) => {
    const start = Date.now();

    const validationError = validate(event);
    if (validationError) {
        return LambdaResponse.badRequest(validationError);
    }

    const year = event.year as number || new Date().getUTCFullYear();
    const month = event.month as number || new Date().getUTCMonth() + 1;

    const filename = `${year}-${month}.csv`;

    return proxyHolder.setCredentials()
        .then(() => CountingSitesService.getValuesForMonth(year, month, event.domainName, event.counterId))
        .then(data => {
            return LambdaResponse.ok(data, filename);
        }).catch(error => {
            console.info("error " + error);

            return LambdaResponse.internalError();
        }).finally(() => {
            console.info("method=CountingSites.GetCSVData tookMs=%d", (Date.now() - start));
        });
};
