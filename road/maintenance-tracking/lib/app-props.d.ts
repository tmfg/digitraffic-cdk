import {Duration} from "@aws-cdk/core";
import {LambdaConfiguration} from "digitraffic-common/stack/lambda-configs";

export interface AppProps extends LambdaConfiguration {
    dlqBucketName: string;
    sqsExtendedMessageBucketName: string;
    sqsProcessLambdaConcurrentExecutions: number;
    /** Topic to send errors in message handling **/
    errorNotificationSnsTopicArn:string;
}
