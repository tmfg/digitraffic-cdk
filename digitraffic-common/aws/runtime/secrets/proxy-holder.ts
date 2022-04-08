import {SecretHolder} from "./secret-holder";
import {DatabaseEnvironmentKeys, RdsProxySecret} from "./dbsecret";

const RDS_PROXY_SECRET_KEYS = ['username', 'password', 'proxy_host', 'proxy_ro_host'];

export class ProxyHolder {
    private readonly secretHolder;

    constructor(secretId: string) {
        this.secretHolder = new SecretHolder<RdsProxySecret>(secretId, '', RDS_PROXY_SECRET_KEYS);
    }

    static create() {
        return new ProxyHolder(process.env.SECRET_ID as string);
    }

    public async setCredentials() {
        const secret = await this.secretHolder.get();

        process.env[DatabaseEnvironmentKeys.DB_USER] = secret.username;
        process.env[DatabaseEnvironmentKeys.DB_PASS] = secret.password;
        process.env[DatabaseEnvironmentKeys.DB_URI] = secret.proxy_host;
        process.env[DatabaseEnvironmentKeys.DB_RO_URI] = secret.proxy_ro_host;
    }
}
