export enum EnvKeys {
    AWS_REGION = "AWS_REGION",
    SECRET_ID = "SECRET_ID",
    SECRET_OVERRIDE_AWS_REGION = "SECRET_OVERRIDE_AWS_REGION",
}

/**
 * @deprecated Use digitraffic/common/utils/utils#getEnvVariable
 */
export function envValue(key: string, defaultValue?: string): string {
    const value = process.env[key];

    if (value === null || value === undefined) {
        if (defaultValue) {
            return defaultValue;
        }

        throw new Error(`Missing environment value ${key}`);
    }

    return value;
}
