import {Schedule} from "@aws-cdk/aws-synthetics-alpha";

/** Optional env parameters for canary */
type CanaryEnv = Record<string, string>;

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
    readonly canaryEnv?: CanaryEnv;
}
