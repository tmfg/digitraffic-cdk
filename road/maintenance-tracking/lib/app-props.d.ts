import {Duration} from "@aws-cdk/core";
import {LambdaConfiguration} from "../../../common/stack/lambda-configs";

export interface AppProps extends LambdaConfiguration {
    dlqBucketName: string;
    dlqNotificationDuration: Duration;
    sqsProcessLambdaConcurrentExecutions: number;
    /** Topic to send errors in message handling **/
    errorNotificationSnsTopicArn:string;
}
