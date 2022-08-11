import {fetchRemoteDisruptions, saveDisruptions} from "../../service/disruptions";
import {ProxyHolder} from "digitraffic-common/aws/runtime/secrets/proxy-holder";
import {SecretHolder} from "digitraffic-common/aws/runtime/secrets/secret-holder";

const proxyHolder = ProxyHolder.create();
const secretHolder = SecretHolder.create();

export const handler = async () : Promise<void> => {
    return proxyHolder.setCredentials()
        .then(() => secretHolder.get())
        .then((secret: any) => fetchRemoteDisruptions(secret['waterwaydisturbances.url'] as string))
        .then(distruptions => saveDisruptions(distruptions));
};

