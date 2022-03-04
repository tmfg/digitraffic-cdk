import {SecretHolder} from "../../../../../digitraffic-common/aws/runtime/secrets/secret-holder";
import * as UpdateService from "../../service/update";
import {PermitsSecret} from "../../model/permits-secret";

const PERMIT_DOMAIN = process.env.PERMIT_DOMAIN as string;
const holder = SecretHolder.create<PermitsSecret>('ep.' + PERMIT_DOMAIN);

export const handler = async () => {
    await holder.setDatabaseCredentials();

    const start = Date.now();

    try {
        const secret = await holder.get();

        return await UpdateService.updatePermits(secret.authKey, secret.url);
    } finally {
        console.info("method=updatePermits.%s tookMs=%d", PERMIT_DOMAIN, (Date.now()-start));
    }
};