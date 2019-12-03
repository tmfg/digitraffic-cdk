/*
    Example stack configuration interfaces
 */

declare interface Props {
    vpcId: string;
    privateSubnetIds: string[];
    availabilityZones: string[];
    lambdaDbSgId: string;
    dbProps: DbProps;
    defaultLambdaDurationSeconds: number;
}
declare interface DbProps {
    username: string;
    password: string;
    uri: string;
}