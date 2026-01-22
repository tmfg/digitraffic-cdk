import type { SendMessageCommandInput } from "@aws-sdk/client-sqs";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import type { APIGatewayEvent } from "aws-lambda";
import type { ExtendedSqsClient } from "sqs-extended-client";
import { MaintenanceTrackingEnvKeys } from "../../keys.js";
import type { TyokoneenseurannanKirjaus } from "../../model/models.js";
import { createExtendedSqsClient } from "../../service/sqs-big-payload.js";
import { getErrorMessage } from "../../util/util.js";

const sqsQueueUrl = getEnvVariable(MaintenanceTrackingEnvKeys.SQS_QUEUE_URL);
const region = getEnvVariable("AWS_REGION");
const sqsBucketName = getEnvVariable(
  MaintenanceTrackingEnvKeys.SQS_BUCKET_NAME,
);

const sqsExtendedClient = createExtendedSqsClient() satisfies ExtendedSqsClient;

export const handler: (
  apiGWRequest: APIGatewayEvent,
) => Promise<ResponseValue> = handlerFn(sqsExtendedClient);

export function handlerFn(
  sqsExtendedClient: ExtendedSqsClient,
): (request: APIGatewayEvent) => Promise<ResponseValue> {
  return async (apiGWRequest: APIGatewayEvent): Promise<ResponseValue> => {
    const method = "MaintenanceTracking.updateQueue" as const;
    const start = Date.now();
    logger.info({
      method,
      message: `bucketName=${sqsBucketName} sqsQueueUrl=${sqsQueueUrl} and region: ${region} apiGWRequest type: ${typeof apiGWRequest}`,
    });
    if (!apiGWRequest.body) {
      logger.info({
        method,
        message: `empty message body`,
      });
      return Promise.reject(invalidRequest(`Empty message`));
    }

    try {
      const messageSizeBytes = Buffer.byteLength(apiGWRequest.body);
      // Just validate parsing
      JSON.parse(apiGWRequest.body) as TyokoneenseurannanKirjaus;
      // Send command
      const sendCommand: SendMessageCommandInput = {
        QueueUrl: sqsQueueUrl,
        MessageBody: apiGWRequest.body,
        // Only for FIFO
        //MessageDeduplicationId: MaintenanceTrackingService.createMaintenanceTrackingMessageHash(apiGWRequest.body)
      };

      const response = await sqsExtendedClient.sendMessage(sendCommand);
      // await sqsProducer.sendJSON(json);
      logger.info({
        method,
        message: `sqs.sendMessage`,
        tookMs: Date.now() - start,
        customSizeBytes: messageSizeBytes,
        customResponse: JSON.stringify(response),
        customCount: 1,
      });
      return Promise.resolve(ok());
    } catch (e) {
      logger.debug(`maybeError: ${JSON.stringify(e)}`);
      const error = getErrorMessage(e);
      logger.error({
        method,
        message: `Error while sending message to SQS`,
        tookMs: Date.now() - start,
        error: error,
      });
      return Promise.reject(
        invalidRequest(`Error while sending message to SQS: ${error}`),
      );
    }
  };
}

interface ResponseValue {
  readonly statusCode: number;
  readonly body: string;
}

export function invalidRequest(msg: string): ResponseValue {
  return {
    statusCode: 400,
    body: `Invalid request: ${msg}`,
  };
}

export function ok(): ResponseValue {
  return {
    statusCode: 200,
    body: "OK",
  };
}
