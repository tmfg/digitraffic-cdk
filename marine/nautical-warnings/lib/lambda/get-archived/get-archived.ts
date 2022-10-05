import * as NauticalWarningsService from "../../service/nautical-warnings";
import {ProxyHolder} from "@digitraffic/common/aws/runtime/secrets/proxy-holder";

const proxyHolder = ProxyHolder.create();

export const handler = () => {
    return proxyHolder.setCredentials()
        .then(() => NauticalWarningsService.getArchivedWarnings());
};

