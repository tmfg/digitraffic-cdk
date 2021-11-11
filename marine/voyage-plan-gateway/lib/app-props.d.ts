import {Duration} from "@aws-cdk/core";
import {StackConfiguration} from "digitraffic-common/stack/stack";

declare interface VoyagePlanGatewayProps extends StackConfiguration {
    readonly secretId: string
    readonly dlqBucketName: string
    readonly rtzStorageBucketName: string
    readonly dlqNotificationDuration: Duration
    readonly alarmTopicArn: string
    readonly warningTopicArn: string
}
