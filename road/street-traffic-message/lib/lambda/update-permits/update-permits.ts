import {SecretHolder} from "../../../../../digitraffic-common/aws/runtime/secrets/secret-holder";
import * as UpdateService from "../../service/update";
import {PermitsSecret} from "../../model/permits-secret";
import {ProxyHolder} from "digitraffic-common/aws/runtime/secrets/proxy-holder";

const PERMIT_DOMAIN = process.env.PERMIT_DOMAIN as string;
const proxyHolder = ProxyHolder.create();
const secretHolder = SecretHolder.create<PermitsSecret>('ep.' + PERMIT_DOMAIN);

export const handler = async () => {
    const start = Date.now();

    return proxyHolder.setCredentials()
        .then(async () => {
            const secret = await secretHolder.get();
            await UpdateService.updatePermits(secret.authKey, secret.url);
        }).finally(() => {
            console.info("method=StreetTrafficMessage.updatePermits.%s tookMs=%d", PERMIT_DOMAIN, (Date.now()-start));
        });
};