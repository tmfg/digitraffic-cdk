import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";
import middy from "@middy/core";
import sqsPartialBatchFailureMiddleware from "@middy/sqs-partial-batch-failure";
import type { Handler, SQSEvent, SQSRecord } from "aws-lambda";
import type { UnknownDelayOrTrackMessage } from "../../model/dt-rosm-message.js";
import { processUdotMessage } from "../../service/process-udot-message.js";
import {
  createTraceContext,
  getTraceFields,
  runWithChildSpan,
  runWithTraceContext,
} from "../../util/tracing.js";

async function handleSQSRecord(r: SQSRecord): Promise<void> {
  return runWithChildSpan(async () => {
    const start = Date.now();
    const recordBody = r.body;

    try {
      const udotMessage = JSON.parse(recordBody) as UnknownDelayOrTrackMessage;

      logger.info({
        ...getTraceFields(),
        method: "RAMI-ProcessUDOTQueue.handleSQSRecord",
        customEvent: "message_processing_started",
        customSqsMessageId: r.messageId,
        customTrainNumber: udotMessage.trainNumber,
        customTrainDepartureDate: udotMessage.departureDate,
        customDataRowCount: udotMessage.data.length,
      });

      await processUdotMessage(udotMessage);

      logger.info({
        ...getTraceFields(),
        method: "RAMI-ProcessUDOTQueue.handleSQSRecord",
        customEvent: "message_processing_succeeded",
        customSqsMessageId: r.messageId,
        tookMs: Date.now() - start,
      });

      return Promise.resolve();
    } catch (error) {
      logException(logger, error);
      logger.error({
        ...getTraceFields(),
        method: "RAMI-ProcessUDOTQueue.handleSQSRecord",
        customEvent: "message_processing_failed",
        customSqsMessageId: r.messageId,
        tookMs: Date.now() - start,
        error,
      });
      return Promise.reject(error);
    }
  });
}

export function handlerFn(): (
  event: SQSEvent,
) => Promise<PromiseSettledResult<void>[]> {
  return async (event: SQSEvent) => {
    const startEventProcessing = Date.now();
    const traceContext = createTraceContext();
    return await runWithTraceContext(traceContext, async () => {
      try {
        return await Promise.allSettled(event.Records.map(handleSQSRecord));
      } finally {
        logger.info({
          ...getTraceFields(),
          method: "RAMI-ProcessUDOTQueue.handler",
          tookMs: Date.now() - startEventProcessing,
          customRecordCount: event.Records.length,
        });
      }
    });
  };
}

export const handler: Handler = middy(handlerFn()).use(
  sqsPartialBatchFailureMiddleware(),
);
