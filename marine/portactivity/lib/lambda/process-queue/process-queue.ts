import {saveTimestamp, UpdatedTimestamp} from "../../service/timestamps";
import {validateTimestamp} from "../../model/timestamp";
import {SQSEvent} from "aws-lambda";
import {EmptySecretFunction, withDbSecret} from "digitraffic-common/aws/runtime/secrets/dbsecret";
import {PortactivityEnvKeys} from "../../keys";
import {DTDatabase, inDatabase} from "digitraffic-common/database/database";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const middy = require('@middy/core');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sqsPartialBatchFailureMiddleware = require('@middy/sqs-partial-batch-failure');

export function handlerFn(withDbSecretFn: EmptySecretFunction<PromiseSettledResult<void | UpdatedTimestamp | null>[]>) {
    return (event: SQSEvent) => {
        return withDbSecretFn(process.env[PortactivityEnvKeys.SECRET_ID] as string, () => {
            return inDatabase((db: DTDatabase) => {
                return Promise.allSettled(event.Records.map(r => {
                    const timestamp = JSON.parse(r.body);
                    const start = Date.now();
                    console.info('DEBUG method=processTimestampQueue processing timestamp', timestamp);

                    if (!validateTimestamp(timestamp)) {
                        console.warn('DEBUG method=processTimestampQueue timestamp did not pass validation');
                        // resolve so this gets removed from the queue
                        return Promise.resolve();
                    }
                    const saveTimestampPromise = saveTimestamp(timestamp, db);
                    saveTimestampPromise.then(value => {
                        if (value) {
                            console.log('DEBUG method=processTimestampQueue update successful');
                        } else {
                            console.log('DEBUG method=processTimestampQueue update conflict or failure');
                        }
                    }).catch((error) => {
                        console.error('method=processTimestampQueue update failed', error);
                    });
                    console.info(`DEBUG method=processTimestampQueue update tookMs=${Date.now() - start}`);
                    return saveTimestampPromise;
                }));
            });
        });
    };
}

export const handler: (e: SQSEvent) => Promise<PromiseSettledResult<unknown>> = middy(handlerFn(withDbSecret)).use(sqsPartialBatchFailureMiddleware());
