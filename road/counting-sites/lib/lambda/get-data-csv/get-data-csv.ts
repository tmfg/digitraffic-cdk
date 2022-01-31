import {withDbSecret} from "digitraffic-common/aws/runtime/secrets/dbsecret";
import * as CountingSitesService from "../../service/counting-sites";
import {LambdaResponse} from "digitraffic-common/aws/types/lambda-response";

const secretId = process.env.SECRET_ID as string;

type CsvValuesEvent = Record<string, number | string>;

export const handler = (event: CsvValuesEvent) => {
    const start = Date.now();

    const validationError = validateParameters(event);
    if (validationError) {
        return Promise.resolve(LambdaResponse.badRequest(validationError));
    }

    const year = event.year as number || new Date().getUTCFullYear();
    const month = event.month as number || new Date().getUTCMonth() + 1;

    const domainName = event.domainName as string;
    const counterId = event.counterId as string;

    const filename = `${year}-${month}.csv`;

    return withDbSecret(secretId, () => {
        return CountingSitesService.getValuesForMonth(year, month, domainName, counterId).then(data => {
            return LambdaResponse.ok(data, filename);
        }).catch(error => {
            console.info("error " + error);

            return LambdaResponse.internalError();
        }).finally(() => {
            console.info("method=CountingSites.GetCSVData tookMs=%d", (Date.now() - start));
        });
    });
};

function validateParameters(event: CsvValuesEvent): string | null {
    const year = event.year as number;
    const month = event.month as number;

    if ((year && !month) || (month && !year)) {
        return 'Both year and month are required';
    }

    return null;
}
