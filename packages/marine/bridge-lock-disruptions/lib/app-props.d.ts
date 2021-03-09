export interface Props {
    readonly vpcId: string;
    readonly privateSubnetIds: string[];
    readonly availabilityZones: string[];
    readonly lambdaDbSgId: string;
    readonly defaultLambdaDurationSeconds: number;
    readonly logsDestinationArn: string;
    readonly secretId: string
}
