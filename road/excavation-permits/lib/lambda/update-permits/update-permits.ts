import {SecretHolder} from "../../../../../digitraffic-common/aws/runtime/secrets/secret-holder";
import * as UpdateService from "../../service/update";
import {PermitsSecret} from "../../model/permits-secret";

const authKeySecretId = process.env.AUTH_KEY_ID as string;

const holder = SecretHolder.create<PermitsSecret>(authKeySecretId);

export const handler = async () => {
    await holder.setDatabaseCredentials();

    const start = Date.now();

    try {
        const secret = await holder.get();

        return UpdateService.updatePermits(secret.authKey);
    } finally {
        console.info("method=updatePermits.%s tookMs=%d", (Date.now()-start));
    }
};