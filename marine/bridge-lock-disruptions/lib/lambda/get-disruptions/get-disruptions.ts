import { findAllDisruptions } from "../../service/disruptions";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";

const proxyHolder = ProxyHolder.create();

export const handler = (): Promise<LambdaResponse> => {
    return proxyHolder
        .setCredentials()
        .then(() => findAllDisruptions())
        .then(([disruptions, lastModified]) =>
            LambdaResponse.ok(JSON.stringify(disruptions)).withTimestamp(lastModified)
        )
        .catch((error: Error) => {
            logException(logger, error, true);

            return LambdaResponse.internalError();
        });
};
