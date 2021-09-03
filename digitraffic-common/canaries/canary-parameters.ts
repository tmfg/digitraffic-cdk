import {Duration} from "@aws-cdk/core";

export type CanaryParameters = {
    readonly name: string;
    readonly rate?: Duration;
    readonly secret?: string;
    readonly handler?: string;
    readonly alarm?: {
        readonly alarmName?: string;
        readonly description?: string;
        readonly evalutionPeriods?: number;
        readonly threshold?: number;
        readonly topicArn?: string;
    }
}