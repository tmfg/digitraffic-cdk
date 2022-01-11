import {withSecret, withSecretAndPrefix} from "./secret";

export interface DbSecret {
    readonly username: string
    readonly password: string
    readonly host: string
    readonly ro_host: string;
}

export enum DatabaseEnvironmentKeys {
    DB_USER = "DB_USER",
    DB_PASS = "DB_PASS",
    DB_URI = "DB_URI",
    DB_RO_URI = "DB_RO_URI",
    DB_APPLICATION = "DB_APPLICATION",
}

function setDbSecret(secret: DbSecret) {
    process.env[DatabaseEnvironmentKeys.DB_USER] = secret.username;
    process.env[DatabaseEnvironmentKeys.DB_PASS] = secret.password;
    process.env[DatabaseEnvironmentKeys.DB_URI] = secret.host;
    process.env[DatabaseEnvironmentKeys.DB_RO_URI] = secret.ro_host;
}

// cached at Lambda container level
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedSecret: any;

const missingSecretErrorText = 'Missing or empty secretId';

/**
 * You can give the following options for retrieving a secret:
 *
 * expectedKeys: the list of keys the secret must include.  If not, an error will be thrown.
 * prefix: a prefix that's included in retrieved secret's keys.  Only keys begining with the prefix will be included.
 * The secret that is passed to the given function will not include the prefix in it's keys.

 */
export type SecretOptions = {
    readonly expectedKeys?: string[],
    readonly prefix?: string
}

export type SecretToPromiseFunction<Secret, Response = void> = (secret: Secret) => Promise<Response> | void;
export type SecretFunction<Secret, Response = void> = (secretId: string, fn: SecretToPromiseFunction<Secret, Response>, options?: SecretOptions) => Promise<Response | void>;
export type EmptySecretFunction<Response = void> = SecretFunction<DbSecret, Response>;

/**
 * Run the given function with secret retrieved from Secrets Manager.  Also injects database-credentials into environment.
 *
 * @see SecretOptions
 *
 * @param {string} secretId
 * @param {function} fn
 * @param {SecretOptions} options
 */
export async function withDbSecret<Secret, Response>(secretId: string, fn: SecretToPromiseFunction<Secret, Response>, options?: SecretOptions): Promise<Response | void> {
    if (!secretId) {
        console.error(missingSecretErrorText);
        return Promise.reject(missingSecretErrorText);
    }

    if (!cachedSecret) {
        // if prefix is given, first set db values and then fetch secret
        if (options?.prefix) {
            // first set db values
            await withSecret(secretId, (fetchedSecret: DbSecret) => {
                setDbSecret(fetchedSecret);
            });

            // then actual secret
            await withSecretAndPrefix(secretId, options.prefix, (fetchedSecret: Secret) => {
                cachedSecret = fetchedSecret;
            });
        } else {
            await withSecret(secretId, (fetchedSecret: DbSecret) => {
                setDbSecret(fetchedSecret);
                cachedSecret = fetchedSecret;
            });
        }
    }
    try {
        if (options?.expectedKeys?.length) {
            checkExpectedSecretKeys(options.expectedKeys, cachedSecret);
        }
        return fn(cachedSecret);
    } catch (error) {
        console.error('method=withDbSecret Caught an error, refreshing secret', error);
        // try to refetch secret in case it has changed
        await withSecret(secretId, (fetchedSecret: DbSecret) => {
            setDbSecret(fetchedSecret);
            cachedSecret = fetchedSecret;
        });
        return fn(cachedSecret);
    }
}

function checkExpectedSecretKeys<Secret>(keys: string[], secret: Secret) {
    const missingKeys = keys.filter(key => !(key in secret));
    if (missingKeys.length) {
        console.error(`method=checkExpectedSecretKeys secret didn't contain the key(s) ${missingKeys}`);
        throw new Error('Expected keys were not found');
    }
}
