import {saveTimestamp} from "../../service/timestamps";
import {ApiTimestamp, validateTimestamp} from "../../model/timestamp";
import {SQSEvent} from "aws-lambda";
import {DTDatabase, inDatabase} from "@digitraffic/common/database/database";
import middy from "@middy/core";
import sqsPartialBatchFailureMiddleware from "@middy/sqs-partial-batch-failure";
import {RdsHolder} from "@digitraffic/common/aws/runtime/secrets/rds-holder";

const rdsHolder = RdsHolder.create();

export function handlerFn() {
    return (event: SQSEvent) => {
        return rdsHolder.setCredentials().then(() => {
            return inDatabase((db: DTDatabase) => {
                return Promise.allSettled(event.Records.map(r => {
                    const partial = JSON.parse(r.body) as Partial<ApiTimestamp>;
                    const start = Date.now();
                    console.info("DEBUG method=processTimestampQueue processing timestamp", partial);

                    const timestamp = validateTimestamp(partial);
                    if (timestamp == null) {
                        console.warn("DEBUG method=processTimestampQueue timestamp did not pass validation");
                        // resolve so this gets removed from the queue
                        return Promise.resolve();
                    }
                    const saveTimestampPromise = saveTimestamp(timestamp, db);
                    saveTimestampPromise.then(value => {
                        if (value) {
                            console.log("DEBUG method=processTimestampQueue update successful");
                        } else {
                            console.log("DEBUG method=processTimestampQueue update conflict or failure");
                        }
                    }).catch((error) => {
                        console.error("method=processTimestampQueue update failed %s", error);
                    });
                    console.info("DEBUG method=processTimestampQueue update tookMs=%d", Date.now() - start);
                    return saveTimestampPromise;
                }));
            });
        });
    };
}

export const handler = middy(handlerFn()).use(sqsPartialBatchFailureMiddleware());
