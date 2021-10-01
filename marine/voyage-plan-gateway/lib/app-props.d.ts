import {LambdaConfiguration} from "digitraffic-common/stack/lambda-configs";
import {Duration} from "@aws-cdk/core";

declare interface VoyagePlanGatewayProps extends LambdaConfiguration {
    readonly secretId: string
    readonly dlqBucketName: string
    readonly dlqNotificationDuration: Duration
    readonly alarmTopicArn: string
    readonly warningTopicArn: string
}
