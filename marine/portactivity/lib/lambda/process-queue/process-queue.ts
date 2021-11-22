import {saveTimestamp} from "../../service/timestamps";
import {validateTimestamp} from "../../model/timestamp";
import {SQSEvent} from "aws-lambda";
import {SecretFunction, withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {PortactivityEnvKeys} from "../../keys";
import {DTDatabase, inDatabase} from "digitraffic-common/postgres/database";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const middy = require('@middy/core')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sqsPartialBatchFailureMiddleware = require('@middy/sqs-partial-batch-failure')

export function handlerFn(
    withDbSecretFn: SecretFunction
): (event: SQSEvent) => Promise<PromiseSettledResult<unknown>[]> {

    return async (event: SQSEvent): Promise<PromiseSettledResult<unknown>[]> => {
        return withDbSecretFn(process.env[PortactivityEnvKeys.SECRET_ID] as string, async (): Promise<PromiseSettledResult<unknown>[]> => {
            return inDatabase(async (db: DTDatabase) => {
                return await Promise.allSettled(event.Records.map(r => {
                    const timestamp = JSON.parse(r.body);
                    console.info('DEBUG method=processTimestampQueue processing timestamp', timestamp);

                    if (!validateTimestamp(timestamp)) {
                        console.warn('DEBUG method=processTimestampQueue timestamp did not pass validation')
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
                    return saveTimestampPromise;
                }));
            });
        });
    };
}

export const handler: (e: SQSEvent) => Promise<PromiseSettledResult<unknown>> = middy(handlerFn(withDbSecret)).use(sqsPartialBatchFailureMiddleware());
