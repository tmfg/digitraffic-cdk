export interface Props {
    vpcId: string;
    privateSubnetIds: string[];
    availabilityZones: string[];
    lambdaDbSgId: string;
    dbProps: DbProps;
    defaultLambdaDurationSeconds: number;
    logsDestinationArn: string;
    integration: {
        username: string;
        password: string;
        url: string;
    };
    allowFromIpAddresses: string[];
}
export interface DbProps {
    username: string;
    password: string;
    uri: string;
}
