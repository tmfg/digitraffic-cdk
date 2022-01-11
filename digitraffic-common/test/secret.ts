import {DbSecret, EmptySecretFunction, SecretFunction, SecretToPromiseFunction} from "../aws/runtime/secrets/dbsecret";

const EMPTY_DB_SECRET: DbSecret = {
    username: '',
    password: '',
    host: '',
    // eslint-disable-next-line camelcase
    ro_host: '',
};

export function createSecretFunction<Secret, Response>(secret: Secret): SecretFunction<Secret, Response> {
    // eslint-disable-next-line require-await
    return async (secretId: string, fn: SecretToPromiseFunction<Secret, Response>) => {
        return fn(secret);
    };
}

export function createEmptySecretFunction<Response>(): EmptySecretFunction<Response> {
    // eslint-disable-next-line require-await
    return async (secretId: string, fn: SecretToPromiseFunction<DbSecret, Response>) => {
        return fn(EMPTY_DB_SECRET);
    };
}
