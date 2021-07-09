import {LambdaConfiguration} from "../../../common/stack/lambda-configs";

export interface AppProps extends LambdaConfiguration {
    /** Topic to send errors in message handling **/
    errorNotificationSnsTopicArn:string;
    secretId:string
}
