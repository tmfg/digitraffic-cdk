import type { GenericSecret } from "./secret.js";

export enum RdsProxySecretKey {
    username = "username",
    password = "password",
    proxy_host = "proxy_host",
    proxy_ro_host = "proxy_ro_host",
}

export enum RdsSecretKey {
    username = "username",
    password = "password",
    host = "host",
    ro_host = "ro_host",
}

export type RdsProxySecret = Record<RdsProxySecretKey, string>;
export type RdsSecret = Record<RdsSecretKey, string>;

export function checkExpectedSecretKeys<Secret extends GenericSecret>(
    keys: string[],
    secret: Secret
) {
    const missingKeys = keys.filter((key) => !(key in secret));
    if (missingKeys.length) {
        console.error(
            `method=checkExpectedSecretKeys secret didn't contain the key(s) ${missingKeys.toString()}`
        );
        throw new Error("Expected keys were not found");
    }
}
