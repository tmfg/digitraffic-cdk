import {fetchRemoteDisruptions, saveDisruptions} from "../../service/disruptions";
import {ProxyHolder} from "@digitraffic/common/aws/runtime/secrets/proxy-holder";
import {SecretHolder} from "@digitraffic/common/aws/runtime/secrets/secret-holder";
import {GenericSecret} from "@digitraffic/common/aws/runtime/secrets/secret";

const proxyHolder = ProxyHolder.create();
const secretHolder = SecretHolder.create<GenericSecret>();

export const handler = () : Promise<void> => {
    return proxyHolder.setCredentials()
        .then(() => secretHolder.get())
        .then((secret: GenericSecret) => fetchRemoteDisruptions(secret['waterwaydisturbances.url'] as string))
        .then(distruptions => saveDisruptions(distruptions));
};

