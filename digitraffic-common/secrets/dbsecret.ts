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
    DB_APPLICATION = "DB_APPLICATION"
}

function setDbSecret(secret: DbSecret) {
    process.env[DatabaseEnvironmentKeys.DB_USER] = secret.username;
    process.env[DatabaseEnvironmentKeys.DB_PASS] = secret.password;
    process.env[DatabaseEnvironmentKeys.DB_URI] = secret.host;
    process.env[DatabaseEnvironmentKeys.DB_RO_URI] = secret.ro_host;
}

// cached at Lambda container level
let cachedSecret: any;

const missingSecretErrorText = 'Missing or empty secretId';

export type SecretOptions = {
    readonly expectedKeys?: string[],
    readonly prefix?: string
}

export type SecretFunction = (secretId: string, fn: (secret: any) => any, options: SecretOptions) => Promise<any>;

/**
 * Run the given function with secret retrieved from Secrets Manager.  Also injects database-credentials into environment.
 *
 * You can also give the following options:
 * expectedKeys: the list of keys the secret must include.  If not, an error will be thrown.
 * prefix: a prefix that's included in retrieved secret's keys.  Only keys begining with the prefix will be included.
 * The secret that is passed to the given function will not include the prefix in it's keys.
 *
 * @param secretId
 * @param fn
 * @param options
 */
export async function withDbSecret<T>(secretId: string, fn: (secret: any) => T, options?: SecretOptions): Promise<T> {
    if (!secretId) {
        console.error(missingSecretErrorText);
        return Promise.reject(missingSecretErrorText);
    }

    if (!cachedSecret) {
        // if prefix is given, first set db values and then fetch secret
        if(options?.prefix) {
            // first set db values
            await withSecret(secretId, (fetchedSecret: any) => {
                setDbSecret(fetchedSecret);
            });

            // then actual secret
            await withSecretAndPrefix(secretId, options.prefix, (fetchedSecret: any) => {
                cachedSecret = fetchedSecret;
            });
        } else {
            await withSecret(secretId, (fetchedSecret: any) => {
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
        await withSecret(secretId, (fetchedSecret: any) => {
            setDbSecret(fetchedSecret);
            cachedSecret = fetchedSecret;
        });
        return fn(cachedSecret);
    }
}

function checkExpectedSecretKeys(keys: string[], secret: any) {
    const missingKeys = keys.filter(key => !secret.hasOwnProperty(key));
    if (missingKeys.length) {
        console.error(`method=checkExpectedSecretKeys secret didn't contain the key(s) ${missingKeys}`);
        throw new Error('Expected keys were not found');
    }
}
