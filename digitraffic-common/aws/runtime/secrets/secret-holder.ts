import {GenericSecret, getSecret} from "./secret";
import {checkExpectedSecretKeys, DatabaseEnvironmentKeys, DbSecret} from "./dbsecret";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const NodeTtl = require('node-ttl');

const DEFAULT_PREFIX = '';
const DEFAULT_SECRET_KEY = 'SECRET';
const DEFAULT_CONFIGURATION = {
    ttl: 5*60, // timeout secrets in 5 minutes
};

/**
 * Utility class for getting secrets from Secret Manager.
 * Supports prefix for secrets, checking of expected keys and ttl-configuration.
 *
 * By default, secrets are cached for 5 minutes and then reread from the Secrets Manager(This can be overridden with configuration).
 *
 * Supports setting the database environment paramaters from the secret too.
 */
export class SecretHolder<Secret> {
    private readonly secretId: string;
    private readonly prefix: string;
    private readonly expectedKeys: string[];

    private readonly secretCache;

    constructor(secretId: string, prefix = '', expectedKeys: string[] = [], configuration = DEFAULT_CONFIGURATION) {
        this.secretId = secretId;
        this.prefix = prefix;
        this.expectedKeys = expectedKeys;

        this.secretCache = new NodeTtl(configuration);
    }

    private async initSecret() {
        const secretValue = await getSecret<Secret>(this.secretId);

        this.secretCache.push(DEFAULT_SECRET_KEY, secretValue);
    }

    public static create<Secret>(prefix = DEFAULT_PREFIX, expectedKeys: string[] = []) {
        return new SecretHolder<Secret>(process.env.SECRET_ID as string, prefix, expectedKeys);
    }

    public async get(): Promise<Secret> {
        const secret = await this.getSecret<Secret>();
        const parsedSecret = this.prefix === DEFAULT_PREFIX ? secret : this.parseSecret(secret as unknown as GenericSecret,  `${this.prefix}.`);

        if (this.expectedKeys.length > 0) {
            checkExpectedSecretKeys(this.expectedKeys, parsedSecret);
        }

        return parsedSecret;
    }

    private parseSecret(secret: GenericSecret, prefix: string): Secret {
        const parsed: GenericSecret = {};
        const skip = prefix.length;

        for (const key in secret) {
            if (key.startsWith(prefix)) {
                parsed[key.substring(skip)] = secret[key] as string;
            }
        }

        return parsed as unknown as Secret;
    }


    private async getSecret<S>(): Promise<S> {
        const secret = this.secretCache.get(DEFAULT_SECRET_KEY);

        if (!secret) {
            await this.initSecret();
        }

        return secret || this.secretCache.get(DEFAULT_SECRET_KEY);
    }

    public async setDatabaseCredentials() {
        const secret = await this.getSecret<DbSecret>();

        process.env[DatabaseEnvironmentKeys.DB_USER] = secret.username;
        process.env[DatabaseEnvironmentKeys.DB_PASS] = secret.password;
        process.env[DatabaseEnvironmentKeys.DB_URI] = secret.host;
        process.env[DatabaseEnvironmentKeys.DB_RO_URI] = secret.ro_host;
    }
}