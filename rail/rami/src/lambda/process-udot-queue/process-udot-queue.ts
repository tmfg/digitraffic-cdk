import middy from "@middy/core";
import sqsPartialBatchFailureMiddleware from "@middy/sqs-partial-batch-failure";
import type { Handler, SQSEvent } from "aws-lambda";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { processUdotMessage } from "../../service/process-udot-message.js";
import { logException } from "@digitraffic/common/dist/utils/logging";
import type { UnknownDelayOrTrackMessage } from "../../model/dt-rosm-message.js";
import {
  createTraceContext,
  getTraceFields,
  runWithTraceContext,
} from "../../util/tracing.js";

export function handlerFn(): (
  event: SQSEvent,
) => Promise<PromiseSettledResult<void>[]> {
  return async (event: SQSEvent) => {
    return await Promise.allSettled(
      event.Records.map(async (r) => {
        const traceContext = createTraceContext();

        return runWithTraceContext(traceContext, async () => {
          const start = Date.now();
          const recordBody = r.body;

          try {
            const udotMessage = JSON.parse(
              recordBody,
            ) as UnknownDelayOrTrackMessage;

            logger.info({
              ...getTraceFields(),
              method: "RAMI-ProcessUDOTQueue.handler",
              customEvent: "message_processing_started",
              customSqsMessageId: r.messageId,
              customTrainNumber: udotMessage.trainNumber,
              customTrainDepartureDate: udotMessage.departureDate,
              customDataRowCount: udotMessage.data.length,
              customApproximateReceiveCount: parseInt(
                r.attributes.ApproximateReceiveCount,
                10,
              ),
            });

            await processUdotMessage(udotMessage);

            logger.info({
              ...getTraceFields(),
              method: "RAMI-ProcessUDOTQueue.handler",
              customEvent: "message_processing_succeeded",
              customSqsMessageId: r.messageId,
              tookMs: Date.now() - start,
            });

            return Promise.resolve();
          } catch (error) {
            logException(logger, error);
            logger.error({
              ...getTraceFields(),
              method: "RAMI-ProcessUDOTQueue.handler",
              customEvent: "message_processing_failed",
              customSqsMessageId: r.messageId,
              tookMs: Date.now() - start,
              customIsDeadlock: String(error).includes("Deadlock"),
              error,
            });
            return Promise.reject(error);
          }
        });
      }),
    );
  };
}

export const handler: Handler = middy(handlerFn()).use(
  sqsPartialBatchFailureMiddleware(),
);
