import type { Environment } from "aws-cdk-lib/core";

export interface InfraStackConfiguration {
    readonly env: Environment;
    readonly environmentName: string;
}
