import { DatabaseEnvironmentKeys } from "../../../database/database.js";
import { getEnvVariable, setEnvVariable } from "../../../utils/utils.js";
import type { RdsProxySecret } from "./dbsecret.js";
import { RdsProxySecretKey } from "./dbsecret.js";
import { SecretHolder } from "./secret-holder.js";

const RDS_PROXY_SECRET_KEYS = Object.values(RdsProxySecretKey);

/**
 * Holds credentials for RDS Proxy access.
 */
export class ProxyHolder {
  private readonly secretHolder: SecretHolder<RdsProxySecret>;

  constructor(secretId: string) {
    this.secretHolder = new SecretHolder<RdsProxySecret>(
      secretId,
      "",
      RDS_PROXY_SECRET_KEYS,
    );
  }

  static create(): ProxyHolder {
    return new ProxyHolder(getEnvVariable("SECRET_ID"));
  }

  public async setCredentials(): Promise<void> {
    const secret = await this.secretHolder.get();

    setEnvVariable(DatabaseEnvironmentKeys.DB_USER, secret.username);
    setEnvVariable(DatabaseEnvironmentKeys.DB_PASS, secret.password);
    setEnvVariable(DatabaseEnvironmentKeys.DB_URI, secret.proxy_host);
    setEnvVariable(DatabaseEnvironmentKeys.DB_RO_URI, secret.proxy_ro_host);
  }
}
