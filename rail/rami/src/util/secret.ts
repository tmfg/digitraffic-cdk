import {
    getEnvVariable,
    getEnvVariableOrElse,
    getEnvVariableSafe
} from "@digitraffic/common/dist/utils/utils";
import { SecretsManager } from "@aws-sdk/client-secrets-manager";

export enum EnvKeys {
    AWS_REGION = "AWS_REGION",
    SECRET_ID = "SECRET_ID",
    SECRET_OVERRIDE_AWS_REGION = "SECRET_OVERRIDE_AWS_REGION"
}

let smClient: SecretsManager | undefined;
function getSmClient(): SecretsManager {
    if (!smClient) {
        smClient = new SecretsManager({
            region: getEnvVariableOrElse<string>(
                EnvKeys.SECRET_OVERRIDE_AWS_REGION, // this is override secret region
                getEnvVariable(EnvKeys.AWS_REGION)
            )
        });
    }
    return smClient;
}

export type GenericSecret = Record<string, string>;

export async function getSecret<Secret>(secretId: string, prefix: string = ""): Promise<Secret> {
    const secretObj = await getSmClient().getSecretValue({
        SecretId: secretId
    });

    if (!secretObj.SecretString) {
        throw new Error("No secret found!");
    }

    const secret: GenericSecret | Secret = JSON.parse(secretObj.SecretString) as unknown as
        | GenericSecret
        | Secret;

    if (!prefix) {
        return secret as Secret;
    }

    return parseSecret(secret as GenericSecret, `${prefix}.`);
}

function parseSecret<Secret>(secret: GenericSecret, prefix: string): Secret {
    const parsed: GenericSecret = {};
    const skip = prefix.length;

    for (const key in secret) {
        if (key.startsWith(prefix)) {
            parsed[key.substring(skip)] = secret[key] as unknown as string;
        }
    }

    return parsed as unknown as Secret;
}

export async function getFromEnvOrSecret(key: string, secretId: string): Promise<string> {
    const envValue = getEnvVariableSafe(key);
    if (envValue.result === "ok") {
        return envValue.value;
    }
    const secret = await getSecret<GenericSecret>(secretId);
    const secretValue = secret[key];
    if (secretValue !== undefined) {
        return secretValue;
    }
    throw new Error(`Cannot get value with key ${key} from env or secret`);
}
