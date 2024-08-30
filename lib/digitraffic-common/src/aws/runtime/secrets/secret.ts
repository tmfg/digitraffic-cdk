import { SecretsManager } from "@aws-sdk/client-secrets-manager";
import { getEnvVariable, getEnvVariableOrElse, getEnvVariableSafe } from "../../../utils/utils.js";
import { EnvKeys } from "../environment.js";

// SECRET_OVERRIDE_AWS_REGION might not have been set before import of
// secret, so we need to lazy initialize SecretsManager
let smClient: SecretsManager | undefined;
function getSmClient(): SecretsManager {
    if (!smClient) {
        smClient = new SecretsManager({
            region: getEnvVariableOrElse<string>(
                EnvKeys.SECRET_OVERRIDE_AWS_REGION, // this is override secret region
                getEnvVariable(EnvKeys.AWS_REGION),
            ),
        });
    }
    return smClient;
}

export type GenericSecret = Record<string, string>;

export async function getSecret<Secret>(secretId: string, prefix: string = ""): Promise<Secret> {
    const secretObj = await getSmClient().getSecretValue({
        SecretId: secretId,
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
            const withoutPrefix: string = key.substring(skip);
            // skip undefined values
            if (!secret[key]) {
                continue;
            }
            parsed[withoutPrefix] = secret[key];
        }
    }

    return parsed as unknown as Secret;
}

/**
 * Gets variable from environment or from an AWS Secrets Manager secret if not found in the environment.
 * @param Environment key
 * @param Secret id in Secrets Manager
 */

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
