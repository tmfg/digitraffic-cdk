import { saveTimestamp, UpdatedTimestamp } from "../../service/timestamps";
import { validateTimestamp } from "../../service/timestamp-validation";
import { ApiTimestamp } from "../../model/timestamp";
import { SQSEvent } from "aws-lambda";
import { DTDatabase, inDatabase } from "@digitraffic/common/dist/database/database";
import middy from "@middy/core";
import sqsPartialBatchFailureMiddleware from "@middy/sqs-partial-batch-failure";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";

const rdsHolder = RdsHolder.create();

export function handlerFn(): (event: SQSEvent) => Promise<PromiseSettledResult<void | UpdatedTimestamp>[]> {
    return (event: SQSEvent) => {
        return rdsHolder.setCredentials().then(() => {
            return inDatabase((db: DTDatabase) => {
                return Promise.allSettled(
                    event.Records.map(async (r) => {
                        const partial = JSON.parse(r.body) as Partial<ApiTimestamp>;
                        const start = Date.now();
                        logger.debug({
                            method: "ProcessQueue.handler",
                            message: `processing timestamp ${JSON.stringify(partial)}`
                        });

                        const timestamp = await validateTimestamp(partial, db);

                        if (!timestamp) {
                            logger.warn({
                                method: "ProcessQueue.handler",
                                message: "timestamp did not pass validation"
                            });
                            // resolve so this gets removed from the queue
                            return Promise.resolve();
                        }
                        const saveTimestampPromise = saveTimestamp(timestamp, db);
                        saveTimestampPromise
                            .then((value) => {
                                if (value) {
                                    logger.debug({
                                        method: "ProcessQueue.handler",
                                        message: "update successful"
                                    });
                                } else {
                                    logger.debug({
                                        method: "ProcessQueue.handler",
                                        message: "update conflict or failure"
                                    });
                                }
                            })
                            .catch((error) => {
                                logException(logger, error);
                            });
                        logger.debug({
                            method: "ProcessQueue.handler",
                            tookMs: Date.now() - start
                        });
                        return saveTimestampPromise;
                    })
                );
            });
        });
    };
}

export const handler = middy(handlerFn()).use(sqsPartialBatchFailureMiddleware());
