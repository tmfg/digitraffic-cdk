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
                console.info('DEBUG method=processTimestampQueue processing timestamp', timestamp);

                if (!validateTimestamp(timestamp)) {
                    console.warn('DEBUG method=processTimestampQueue timestamp did not pass validation')
                    // resolve so this gets removed from the queue
                    return Promise.resolve();
                }
                const saveTimestampPromise = saveTimestamp(timestamp);
                saveTimestampPromise.then(value => {
                    if (value) {
                        console.log('DEBUG method=processTimestampQueue update successful');
                    } else {
                        console.log('DEBUG method=processTimestampQueue update conflict or failure');
                    }
                }).catch((error) => {
                    console.error('method=processTimestampQueue update failed', error);
                });
                return saveTimestampPromise;
            }));
        });
    };
}

export const handler: (e: SQSEvent) => Promise<any> = middy(handlerFn(withDbSecret)).use(sqsPartialBatchFailureMiddleware());
