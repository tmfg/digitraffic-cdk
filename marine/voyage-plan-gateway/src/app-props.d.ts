import { Duration } from "aws-cdk-lib";
import { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";

declare interface VoyagePlanGatewayProps extends StackConfiguration {
    readonly secretId: string;
    readonly dlqBucketName: string;
    readonly rtzStorageBucketName: string;
    readonly dlqNotificationDuration: Duration;
    readonly alarmTopicArn: string;
    readonly warningTopicArn: string;
}
