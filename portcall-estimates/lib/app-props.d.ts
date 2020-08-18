export interface Props {
    vpcId: string;
    privateSubnetIds: string[];
    availabilityZones: string[];
    lambdaDbSgId: string;
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
