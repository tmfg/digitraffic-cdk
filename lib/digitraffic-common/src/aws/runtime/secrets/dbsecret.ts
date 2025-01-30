import { logger } from "../dt-logger-default.js";
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
  secret: Secret,
): void {
  const missingKeys = keys.filter((key) => !(key in secret));
  if (missingKeys.length) {
    logger.error({
      method: "dbsecret.checkExpectedSecretKeys",
      message: `secret didn't contain the key(s) ${missingKeys.toString()}`,
    });
    throw new Error("Expected keys were not found");
  }
}
