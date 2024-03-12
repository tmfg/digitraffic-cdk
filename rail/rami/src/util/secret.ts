import { getEnvVariableSafe } from "@digitraffic/common/dist/utils/utils";
import { getSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";
import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";

export enum EnvKeys {
    AWS_REGION = "AWS_REGION",
    SECRET_ID = "SECRET_ID",
    SECRET_OVERRIDE_AWS_REGION = "SECRET_OVERRIDE_AWS_REGION"
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
