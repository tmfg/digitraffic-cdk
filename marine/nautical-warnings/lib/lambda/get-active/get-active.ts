import * as NauticalWarningsService from "../../service/nautical-warnings";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { nwHandlerFactory } from "../../service/event-handler";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";

const proxyHolder = ProxyHolder.create();

export const handler = nwHandlerFactory.createEventHandler(
    "GetActive.handler",
    () => {
        return proxyHolder
            .setCredentials()
            .then(() =>
                LambdaResponse.okJson(
                    NauticalWarningsService.getActiveWarnings()
                )
            );
    }
);
