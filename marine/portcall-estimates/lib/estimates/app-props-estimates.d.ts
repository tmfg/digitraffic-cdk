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
}
export interface DbProps {
    username: string;
    password: string;
    uri: string;
    ro_uri: string;
}
