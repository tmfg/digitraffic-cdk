import middy from "@middy/core";
import sqsPartialBatchFailureMiddleware from "@middy/sqs-partial-batch-failure";
import type { Handler, SQSEvent } from "aws-lambda";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { processUdotMessage } from "../../service/process-udot-message.js";
import { logException } from "@digitraffic/common/dist/utils/logging";
import type { UnknownDelayOrTrackMessage } from "../../model/dt-rosm-message.js";

export function handlerFn(): (
  event: SQSEvent,
) => Promise<PromiseSettledResult<void>[]> {
  return async (event: SQSEvent) => {
    const start = Date.now();

    try {
      return await Promise.allSettled(
        Object.values(
          event.Records.reduce(
            (acc: { [s: string]: UnknownDelayOrTrackMessage[] }, r) => {
              const recordBody = r.body;

              try {
                const udotMessage = JSON.parse(
                  recordBody,
                ) as UnknownDelayOrTrackMessage;

                const key =
                  `${udotMessage.trainNumber}-${udotMessage.departureDate}`;
                if (acc[key]) {
                  acc[key].push(udotMessage);
                } else {
                  acc[key] = [udotMessage];
                }
              } catch (error) {
                logException(logger, error);
              }
              return acc;
            },
            {},
          ),
        ).map(async (udotMessages) => {
          try {
            for (const udotMessage of udotMessages) {
              logger.info({
                method: "RAMI-ProcessUDOTQueue.handler",
                message:
                  `processing ${udotMessage.trainNumber} ${udotMessage.departureDate}`,
                customCount: udotMessage.data.length,
              });
              await processUdotMessage(udotMessage);
            }
          } catch (error) {
            logException(logger, error);
          }
        }),
      );
    } finally {
      logger.info({
        method: "RAMI-ProcessUDOTQueue.handler",
        tookMs: Date.now() - start,
        customRecordCount: event.Records.length,
      });
    }
  };
}

export const handler: Handler = middy(handlerFn()).use(
  sqsPartialBatchFailureMiddleware(),
);
