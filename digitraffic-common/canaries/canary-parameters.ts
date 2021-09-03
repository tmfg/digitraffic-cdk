import {Duration} from "@aws-cdk/core";

export interface CanaryParameters {
    readonly name: string;
    readonly rate?: Duration;
    readonly secret?: string;
    readonly alarm?: boolean;
}