import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { HandlerFactory } from "@digitraffic/common/dist/aws/infra/api/handler-factory";

export function handleError(error: unknown) {
    console.error("error %s", error);
    console.error((error as Error).stack);

    return LambdaResponse.internalError();
}

export const nwHandlerFactory =
    new HandlerFactory<LambdaResponse>().withErrorHandler(handleError);
