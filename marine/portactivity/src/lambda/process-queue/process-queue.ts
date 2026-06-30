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
) => Promise<PromiseSettledResult<undefined | UpdatedTimestamp>[]> {
  return (event: SQSEvent) => {
    return rdsHolder.setCredentials().then(() => {
      return inDatabase(async (db: DTDatabase) => {
        // Sequential processing: each record runs queries on the same single
        // pg connection. Parallelizing (Promise.all) triggers the pg
        // "client is already executing a query" deprecation warning.
        const results: PromiseSettledResult<undefined | UpdatedTimestamp>[] =
          [];

        for (const r of event.Records) {
          const partial = JSON.parse(r.body) as Partial<ApiTimestamp>;
          const start = Date.now();
          logger.debug({
            method: "ProcessQueue.handler",
            message: `processing timestamp ${JSON.stringify(partial)}`,
          });

          try {
            const timestamp = await validateTimestamp(partial, db);

            if (!timestamp) {
              logger.warn({
                method: "ProcessQueue.handler",
                message: "timestamp did not pass validation",
              });
              results.push({ status: "fulfilled", value: undefined });
              continue;
            }

            const value = await saveTimestamp(timestamp, db);

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

            results.push({ status: "fulfilled", value });
          } catch (error) {
            logException(logger, error);
            results.push({
              status: "rejected",
              reason: error,
            });
          } finally {
            logger.debug({
              method: "ProcessQueue.handler",
              tookMs: Date.now() - start,
            });
          }
        }

        return results;
      });
    });
  };
}

export const handler: Handler = middy(handlerFn()).use(
  sqsPartialBatchFailureMiddleware(),
);
