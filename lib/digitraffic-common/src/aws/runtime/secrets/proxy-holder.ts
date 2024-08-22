import { SecretHolder } from "./secret-holder.js";
import { type RdsProxySecret, RdsProxySecretKey } from "./dbsecret.js";
import { getEnvVariable } from "../../../utils/utils.js";
import { DatabaseEnvironmentKeys } from "../../../database/database.js";

const RDS_PROXY_SECRET_KEYS = Object.values(RdsProxySecretKey);

/**
 * Holds credentials for RDS Proxy access.
 */
export class ProxyHolder {
    private readonly secretHolder;

    constructor(secretId: string) {
        this.secretHolder = new SecretHolder<RdsProxySecret>(secretId, "", RDS_PROXY_SECRET_KEYS);
    }

    static create() {
        return new ProxyHolder(getEnvVariable("SECRET_ID"));
    }

    public async setCredentials() {
        const secret = await this.secretHolder.get();

        process.env[DatabaseEnvironmentKeys.DB_USER] = secret.username;
        process.env[DatabaseEnvironmentKeys.DB_PASS] = secret.password;
        process.env[DatabaseEnvironmentKeys.DB_URI] = secret.proxy_host;
        process.env[DatabaseEnvironmentKeys.DB_RO_URI] = secret.proxy_ro_host;
    }
}
