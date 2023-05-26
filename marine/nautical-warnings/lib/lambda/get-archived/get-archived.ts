import * as NauticalWarningsService from "../../service/nautical-warnings";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { nwHandlerFactory } from "../../service/event-handler";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const proxyHolder = ProxyHolder.create();

export const handler = nwHandlerFactory.createEventHandler(() => {
    return proxyHolder.setCredentials().then(async () => {
        const [featureCollection, lastModified] = await NauticalWarningsService.getArchivedWarnings();
        return LambdaResponse.okJson(featureCollection).withTimestamp(lastModified);
    });
}, logger);
