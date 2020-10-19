import {Duration} from "@aws-cdk/core";

export interface Props {
    vpcId: string;
    privateSubnetIds: string[];
    availabilityZones: string[];
    lambdaDbSgId: string;
    dlqBucketName: string;
    dlqNotificationTopicArn: string;
    dlqNotificationDuration: Duration;
    dbProps: DbProps;
    defaultLambdaDurationSeconds: number;
    logsDestinationArn: string;
    sqsProcessLambdaConcurrentExecutions: number;
    etaProps: {
        readonly clientId: string
        readonly clientSecret: string
        readonly audience: string
        readonly authUrl: string
        readonly endpointUrl: string
    }
}
export interface DbProps {
    username: string;
    password: string;
    uri: string;
    ro_uri: string;
}
