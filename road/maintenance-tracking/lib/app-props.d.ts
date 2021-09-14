import {LambdaConfiguration} from "digitraffic-common/stack/lambda-configs";

declare interface AppProps extends LambdaConfiguration {
    readonly secretId: string,
    readonly sqsDlqBucketName: string;
    readonly sqsMessageBucketName: string;
    readonly sqsProcessLambdaConcurrentExecutions: number;
    /** Topic to send errors in message handling **/
    readonly errorNotificationSnsTopicArn: string;
}
