import {withSecret} from "./secret";

export interface DbSecret {
    readonly username: string
    readonly password: string
    readonly host: string
}

function setDbSecret(secret: DbSecret) {
    process.env.DB_USER = secret.username;
    process.env.DB_PASS = secret.password;
    process.env.DB_URI = secret.host;
}

// cached at Lambda container level
let cachedSecret: any;

const missingSecretErrorText = 'Missing or empty secretId';

export async function withDbSecret<T>(secretId: string, fn: (secret: any) => T): Promise<T> {
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
        return await fn(cachedSecret);
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
