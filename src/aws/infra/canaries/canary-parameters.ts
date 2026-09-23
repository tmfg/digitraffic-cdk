import type { Runtime, Schedule } from "aws-cdk-lib/aws-synthetics";

/** Optional env parameters for canary */
type CanaryEnv = Record<string, string>;

export interface CanaryParameters {
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
  };
  readonly canaryEnv?: CanaryEnv;
  readonly runtime?: Runtime;
}
