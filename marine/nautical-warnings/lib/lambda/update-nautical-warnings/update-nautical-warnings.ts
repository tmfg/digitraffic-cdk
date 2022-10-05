import {NauticalWarningsSecret} from "../../model/secret";
import * as NauticalWarningsService from "../../service/nautical-warnings";
import {SecretHolder} from "@digitraffic/common/aws/runtime/secrets/secret-holder";
import {ProxyHolder} from "@digitraffic/common/aws/runtime/secrets/proxy-holder";

const proxyHolder = ProxyHolder.create();
const secretHolder = SecretHolder.create<NauticalWarningsSecret>('nauticalwarnings');

export const handler = () => {
    return proxyHolder.setCredentials()
        .then(() => secretHolder.get())
        .then(secret => NauticalWarningsService.updateNauticalWarnings(secret.url));
};
