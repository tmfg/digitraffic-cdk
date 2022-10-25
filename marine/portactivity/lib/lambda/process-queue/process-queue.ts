import {saveTimestamp, UpdatedTimestamp} from "../../service/timestamps";
import {ApiTimestamp, validateTimestamp} from "../../model/timestamp";
import {SQSEvent} from "aws-lambda";
import {EmptySecretFunction, withDbSecret} from "@digitraffic/common/aws/runtime/secrets/dbsecret";
import {PortactivityEnvKeys} from "../../keys";
import {DTDatabase, inDatabase} from "@digitraffic/common/database/database";
import {envValue} from "@digitraffic/common/aws/runtime/environment";
import middy from "@middy/core";
import sqsPartialBatchFailureMiddleware from "@middy/sqs-partial-batch-failure";

const SECRET_ID = envValue(PortactivityEnvKeys.SECRET_ID);

export function handlerFn(withDbSecretFn: EmptySecretFunction<PromiseSettledResult<void | UpdatedTimestamp | null>[]>) {
    return (event: SQSEvent) => {
        return withDbSecretFn(SECRET_ID, () => {
            return inDatabase((db: DTDatabase) => {
                return Promise.allSettled(event.Records.map(r => {
                    const timestamp = JSON.parse(r.body) as ApiTimestamp;
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

export const handler = middy(handlerFn(withDbSecret)).use(sqsPartialBatchFailureMiddleware());
