export interface Props {
    vpcId: string;
    privateSubnetIds: string[];
    availabilityZones: string[];
    lambdaDbSgId: string;
    dbProps: DbProps;
    defaultLambdaDurationSeconds: number;
    logsDestinationArn: string;
    sqsProcessLambdaConcurrentExecutions: number;
    shiplistSnsTopicArn: string;
    estimateUpdatedTopicArn: string;
    pinpointApplicationId: string;
    pinpointTelephoneNumber: string;
    shiplistUrl: string
}
export interface DbProps {
    username: string;
    password: string;
    uri: string;
    ro_uri: string;
}
