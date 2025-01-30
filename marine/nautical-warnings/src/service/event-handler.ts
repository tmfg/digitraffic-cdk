import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { HandlerFactory } from "@digitraffic/common/dist/aws/infra/api/handler-factory";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";

export function handleError(error: unknown): LambdaResponse {
  logException(logger, error as Error);

  return LambdaResponse.internalError();
}

export const nwHandlerFactory = new HandlerFactory().withErrorHandler(
  handleError,
);
