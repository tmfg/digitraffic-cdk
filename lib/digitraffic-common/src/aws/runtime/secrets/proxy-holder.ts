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

  private constructor(secretHolder: SecretHolder<RdsProxySecret>) {
    this.secretHolder = secretHolder;
  }

  /** Creates a new instance of ProxyHolder from given SecretHolder. */
  static create(secretHolder: SecretHolder<RdsProxySecret>): ProxyHolder;
  /** Creates a new instance of ProxyHolder with a new default SecretHolder(using env variable SECRET_ID). */
  static create(): ProxyHolder;

  static create(secretHolder?: SecretHolder<RdsProxySecret>): ProxyHolder {
    const holder =
      secretHolder ??
      new SecretHolder<RdsProxySecret>(
        getEnvVariable("SECRET_ID"),
        "",
        RDS_PROXY_SECRET_KEYS,
      );

    return new ProxyHolder(holder);
  }

  public async setCredentials(): Promise<void> {
    const secret = await this.secretHolder.get();

    setEnvVariable(DatabaseEnvironmentKeys.DB_USER, secret.username);
    setEnvVariable(DatabaseEnvironmentKeys.DB_PASS, secret.password);
    setEnvVariable(DatabaseEnvironmentKeys.DB_URI, secret.proxy_host);
    setEnvVariable(DatabaseEnvironmentKeys.DB_RO_URI, secret.proxy_ro_host);
  }
}
