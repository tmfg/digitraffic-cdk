import {withSecret} from "./secret";

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
    DB_RO_URI = "DB_RO_URI"
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

export async function withDbSecret<T>(secretId: string, fn: (secret: any) => T, expectedKeys?: string[]): Promise<T> {
    if (!secretId) {
        console.error(missingSecretErrorText);
        return Promise.reject(missingSecretErrorText);
    }

    if (!cachedSecret) {
        await withSecret(secretId, (fetchedSecret: any) => {
            setDbSecret(fetchedSecret);
            cachedSecret = fetchedSecret;
        });
    }
    try {
        if (expectedKeys?.length) {
            checkExpectedSecretKeys(expectedKeys, cachedSecret);
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
