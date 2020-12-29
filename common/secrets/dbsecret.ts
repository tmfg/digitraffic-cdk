import {withSecret} from "./secret";

export interface DbSecret {
    readonly username: string
    readonly password: string
    readonly url: string
}

function setSecret(secret: DbSecret) {
    process.env.DB_USER = secret.username;
    process.env.DB_PASS = secret.password;
    process.env.DB_URI = secret.url;
}

function dbSecretUnset() {
    return !process.env.DB_USER || !process.env.DB_PASS || !process.env.DB_URI;
}

export async function withDbSecret<T>(secretId: string, fn: () => T): Promise<T> {
    if (dbSecretUnset()) {
        await withSecret(secretId, setSecret);
    }
    return fn();
}

export async function withDbSecretAsync<T>(secretId: string, fn: () => Promise<T>): Promise<T> {
    if (dbSecretUnset()) {
        await withSecret(secretId, setSecret);
    }
    return await fn();
}
