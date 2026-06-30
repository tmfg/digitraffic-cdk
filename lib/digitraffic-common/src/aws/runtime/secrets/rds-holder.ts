import { DatabaseEnvironmentKeys } from "../../../database/database.js";
import { getEnvVariable, setEnvVariable } from "../../../utils/utils.js";
import type { RdsSecret } from "./dbsecret.js";
import { RdsSecretKey } from "./dbsecret.js";
import { SecretHolder } from "./secret-holder.js";

const RDS_SECRET_KEYS = Object.values(RdsSecretKey);

/**
 * Holds credentials for RDS access.
 */
export class RdsHolder {
  private readonly secretHolder: SecretHolder<RdsSecret>;

  private constructor(secretHolder: SecretHolder<RdsSecret>) {
    this.secretHolder = secretHolder;
  }

  static create(rdsHolder: SecretHolder<RdsSecret>): RdsHolder;
  static create(): RdsHolder;

  static create(secretHolder?: SecretHolder<RdsSecret>): RdsHolder {
    const holder =
      secretHolder ??
      new SecretHolder<RdsSecret>(
        getEnvVariable("SECRET_ID"),
        "",
        RDS_SECRET_KEYS,
      );

    return new RdsHolder(holder);
  }

  public async setCredentials(): Promise<void> {
    const secret = await this.secretHolder.get();

    setEnvVariable(DatabaseEnvironmentKeys.DB_USER, secret.username);
    setEnvVariable(DatabaseEnvironmentKeys.DB_PASS, secret.password);
    setEnvVariable(DatabaseEnvironmentKeys.DB_URI, secret.host);
    setEnvVariable(DatabaseEnvironmentKeys.DB_RO_URI, secret.ro_host);
  }
}
