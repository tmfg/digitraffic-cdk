import {FunctionProps, Runtime} from '@aws-cdk/aws-lambda';
import {Duration} from "@aws-cdk/core";
import {IVpc, ISecurityGroup} from "@aws-cdk/aws-ec2";
import {RetentionDays} from '@aws-cdk/aws-logs';
import {mergeDeepRight} from 'ramda';

export interface LambdaConfiguration {
    vpcId: string;
    allowFromIpAddresses?: string[];
    privateSubnetIds: string[];
    availabilityZones: string[];
    lambdaDbSgId: string;
    dbProps: DbProps;
    defaultLambdaDurationSeconds?: number;
    logsDestinationArn: string;
    memorySize?: number,
    runtime?: Runtime
}

declare interface DbProps {
    username: string;
    password: string;
    uri?: string;
    ro_uri?: string;
}

// Base configuration for a database-reading Lambda function
export function dbLambdaConfiguration(
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: LambdaConfiguration,
    config: any): FunctionProps {

    return mergeDeepRight({
        code: {},
        handler: {},
        runtime: props.runtime || Runtime.NODEJS_12_X,
        memorySize: props.memorySize || 1024,
        timeout: Duration.seconds(props.defaultLambdaDurationSeconds || 60),
        environment: {
            DB_USER: props.dbProps.username,
            DB_PASS: props.dbProps.password,
            DB_URI: config.readOnly ? props.dbProps.ro_uri : props.dbProps.uri
        },
        logRetention: RetentionDays.ONE_YEAR,
        vpc: vpc,
        vpcSubnets: vpc.privateSubnets,
        securityGroup: lambdaDbSg
    }, config);
}
