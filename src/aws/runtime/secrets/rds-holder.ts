import { SecretHolder } from "./secret-holder.js";
import { type RdsSecret, RdsSecretKey } from "./dbsecret.js";
import { getEnvVariable, setEnvVariable } from "../../../utils/utils.js";
import { DatabaseEnvironmentKeys } from "../../../database/database.js";

const RDS_SECRET_KEYS = Object.values(RdsSecretKey);

/**
 * Holds credentials for RDS access.
 */
export class RdsHolder {
    private readonly secretHolder: SecretHolder<RdsSecret>;

    constructor(secretId: string) {
        this.secretHolder = new SecretHolder<RdsSecret>(secretId, "", RDS_SECRET_KEYS);
    }

    static create(): RdsHolder {
        return new RdsHolder(getEnvVariable("SECRET_ID"));
    }

    public async setCredentials(): Promise<void> {
        const secret = await this.secretHolder.get();

        setEnvVariable(DatabaseEnvironmentKeys.DB_USER, secret.username);
        setEnvVariable(DatabaseEnvironmentKeys.DB_PASS, secret.password);
        setEnvVariable(DatabaseEnvironmentKeys.DB_URI, secret.host);
        setEnvVariable(DatabaseEnvironmentKeys.DB_RO_URI, secret.ro_host);
    }
}
