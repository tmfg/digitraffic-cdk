import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { inDatabase } from "@digitraffic/common/dist/database/database";
import { logException } from "@digitraffic/common/dist/utils/logging";
import middy from "@middy/core";
import sqsPartialBatchFailureMiddleware from "@middy/sqs-partial-batch-failure";
import type { Handler, SQSEvent } from "aws-lambda";
import type { ApiTimestamp } from "../../model/timestamp.js";
import { validateTimestamp } from "../../service/timestamp-validation.js";
import type { UpdatedTimestamp } from "../../service/timestamps.js";
import { saveTimestamp } from "../../service/timestamps.js";

const rdsHolder = RdsHolder.create();

export function handlerFn(): (
  event: SQSEvent,
  // biome-ignore lint/suspicious/noConfusingVoidType: Promise.resolve() returns void
) => Promise<PromiseSettledResult<void | UpdatedTimestamp>[]> {
  return (event: SQSEvent) => {
    return rdsHolder.setCredentials().then(() => {
      return inDatabase((db: DTDatabase) => {
        return Promise.allSettled(
          event.Records.map(async (r) => {
            const partial = JSON.parse(r.body) as Partial<ApiTimestamp>;
            const start = Date.now();
            logger.debug({
              method: "ProcessQueue.handler",
              message: `processing timestamp ${JSON.stringify(partial)}`,
            });

            const timestamp = await validateTimestamp(partial, db);

            if (!timestamp) {
              logger.warn({
                method: "ProcessQueue.handler",
                message: "timestamp did not pass validation",
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
                    message: "update successful",
                  });
                } else {
                  logger.debug({
                    method: "ProcessQueue.handler",
                    message: "update conflict or failure",
                  });
                }
              })
              .catch((error) => {
                logException(logger, error);
              });
            logger.debug({
              method: "ProcessQueue.handler",
              tookMs: Date.now() - start,
            });
            return saveTimestampPromise;
          }),
        );
      });
    });
  };
}

export const handler: Handler = middy(handlerFn()).use(
  sqsPartialBatchFailureMiddleware(),
);
