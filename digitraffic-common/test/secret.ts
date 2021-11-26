import {DbSecret, EmptySecretFunction, SecretFunction, SecretToPromiseFunction} from "../secrets/dbsecret";

const EMPTY_DB_SECRET: DbSecret = {
    username: '',
    password: '',
    host: '',
    ro_host: ''
}

export function createSecretFunction<Secret, Response>(secret: Secret): SecretFunction<Secret, Response> {
    return async (secretId: string, fn: SecretToPromiseFunction<Secret, Response>) => {
        return fn(secret);
    }
}

export function createEmptySecretFunction<Response>(): EmptySecretFunction<Response> {
    return async (secretId: string, fn: SecretToPromiseFunction<DbSecret, Response>) => {
        return fn(EMPTY_DB_SECRET);
    }
}
