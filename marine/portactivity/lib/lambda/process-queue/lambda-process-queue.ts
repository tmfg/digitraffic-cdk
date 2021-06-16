import {saveTimestamp} from "../../service/timestamps";
import {validateTimestamp} from "../../model/timestamp";
import {SQSEvent} from "aws-lambda";
import {withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {PortactivityEnvKeys} from "../../keys";
const middy = require('@middy/core')
const sqsPartialBatchFailureMiddleware = require('@middy/sqs-partial-batch-failure')

export function handlerFn(
    withDbSecretFn: (secretId: string, fn: (_: any) => Promise<void>) => Promise<any>) {

    return async (event: SQSEvent) => {
        return withDbSecretFn(process.env[PortactivityEnvKeys.SECRET_ID] as string, (_: any): Promise<any> => {
            return Promise.allSettled(event.Records.map(r => {

                const timestamp = JSON.parse(r.body);
                console.info('method=processTimestampQueue processing timestamp', timestamp);

                if (!validateTimestamp(timestamp)) {
                    return Promise.reject('method=processTimestampQueue timestamp did not pass validation');
                }
                try {
                    return saveTimestamp(timestamp);
                } catch (err) {
                    console.error('method=processTimestampQueue error persisting timestamp', err);
                    return Promise.reject(err);
                }
            })).then(async timestamps => {
                const successful = timestamps.filter(processedSuccessfully);
                if (successful.length) {
                    // fulfilled promises have a 'value' property
                    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
                    const updates = successful
                        .map(s => (s as any).value)
                        .filter(s => s != null);

                    console.info("method=processTimestampQueue successful %d updates %d", successful.length, updates.length);
                }
                return timestamps;
            });
        });
    };
}

function processedSuccessfully(p: PromiseSettledResult<any>) {
    return p.status === 'fulfilled';
}

export const handler: (e: SQSEvent) => Promise<any> = middy(handlerFn(withDbSecret)).use(sqsPartialBatchFailureMiddleware());
