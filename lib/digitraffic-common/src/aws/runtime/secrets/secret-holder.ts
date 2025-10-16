import { type GenericSecret, getSecret } from "./secret.js";
import { checkExpectedSecretKeys } from "./dbsecret.js";
import { getEnvVariable } from "../../../utils/utils.js";
import { logger } from "../dt-logger-default.js";

const DEFAULT_PREFIX = "";
const DEFAULT_CONFIGURATION = {
  ttl: 5 * 60, // timeout secrets in 5 minutes
} as const;

/**
 * Utility class for getting secrets from Secret Manager.
 * Supports prefix for secrets, checking of expected keys and ttl-configuration.
 *
 * By default, secrets are cached for 5 minutes and then reread from the Secrets Manager(This can be overridden with configuration).
 *
 * Supports setting the database environment paramaters from the secret too.
 *
 * If you want secret manager to get values from different region than the lambda runtime is running, you can override this by
 * setting the region with utils setSecretOverideAwsRegionEnv method.
 */
export class SecretHolder<Secret extends GenericSecret> {
  private readonly secretId: string;
  private readonly prefix: string;
  private readonly expectedKeys: string[];

  private cachedSecret?: Secret;
  private expirationTime: Date;
  private readonly ttl: number; // seconds

  constructor(
    secretId: string,
    prefix: string = "",
    expectedKeys: string[] = [],
    configuration: typeof DEFAULT_CONFIGURATION = DEFAULT_CONFIGURATION,
  ) {
    this.secretId = secretId;
    this.prefix = prefix;
    this.expectedKeys = expectedKeys;
    this.expirationTime = new Date(0);
    this.ttl = configuration.ttl;
  }

  private async initSecret(): Promise<void> {
    const secretValue = await getSecret<Secret>(this.secretId);

    logger.info({
      method: "SecretHolder.initSecret",
      message: "Refreshing secret " + this.secretId,
    });

    this.cachedSecret = secretValue;
    this.expirationTime = new Date(Date.now() + this.ttl * 1000);
  }

  public static create<S extends GenericSecret>(
    prefix: string = DEFAULT_PREFIX,
    expectedKeys: string[] = [],
  ): SecretHolder<S> {
    return new SecretHolder<S>(
      getEnvVariable("SECRET_ID"),
      prefix,
      expectedKeys,
    );
  }

  public async get(): Promise<Secret> {
    const secret = await this.getSecret();
    const parsedSecret = this.prefix === DEFAULT_PREFIX
      ? secret
      : this.parseSecret(secret, `${this.prefix}.`);

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
        const withoutPrefix: string = key.substring(skip);
        // skip undefined values
        if (!secret[key]) {
          continue;
        }
        parsed[withoutPrefix] = secret[key];
      }
    }

    return parsed as unknown as Secret;
  }

  private async getSecret(): Promise<Secret> {
    if (this.expirationTime.getTime() < Date.now()) {
      await this.initSecret();
    }

    if (this.cachedSecret === undefined) {
      throw new Error("SecretHolder in illegal state");
    }

    return this.cachedSecret;
  }
}
