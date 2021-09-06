import {Schedule} from "@aws-cdk/aws-synthetics";

export type CanaryParameters = {
    readonly name: string;
    readonly schedule?: Schedule;
    readonly secret?: string;
    readonly handler: string;
    readonly alarm?: {
        readonly alarmName?: string;
        readonly description?: string;
        readonly evalutionPeriods?: number;
        readonly threshold?: number;
        readonly topicArn?: string;
    }
}