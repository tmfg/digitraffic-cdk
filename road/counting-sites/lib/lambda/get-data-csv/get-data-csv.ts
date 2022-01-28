import {withDbSecret} from "digitraffic-common/aws/runtime/secrets/dbsecret";
import * as CountingSitesService from "../../service/counting-sites";
import {LambdaResponse} from "digitraffic-common/aws/types/lambda-response";

const secretId = process.env.SECRET_ID as string;

export const handler = (event: Record<string, number | string>) => {
    return withDbSecret(secretId, () => {
        const start = Date.now();
        const year = event.year as number;
        const month = event.month as number;

        if ((year && !month) || (month && !year)) {
            return Promise.resolve(LambdaResponse.badRequest('You must give both year and month'));
        }

        const domainName = event.domainName as string;
        const counterId = event.counterId as string;

        const filename = `${year}-${month}.csv`;

        return CountingSitesService.getCsvData(year, month, domainName, counterId).then(data => {
            if (data.length === 0) {
                return LambdaResponse.notFound();
            }
            return LambdaResponse.ok(data, filename);
        }).catch(error => {
            console.info("error " + error);

            return LambdaResponse.internalError();
        }).finally(() => {
            console.info("method=CountingSites.GetCSVData tookMs=%d", (Date.now() - start));
        });
    });
};

