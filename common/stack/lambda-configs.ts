import {Code, FunctionProps, Runtime} from '@aws-cdk/aws-lambda';
import {Duration} from "@aws-cdk/core";
import {ISecurityGroup, IVpc} from "@aws-cdk/aws-ec2";
import {RetentionDays} from '@aws-cdk/aws-logs';
import {Role} from '@aws-cdk/aws-iam'

export interface LambdaConfiguration {
    vpcId: string;
    allowFromIpAddresses?: string[];
    privateSubnetIds: string[];
    availabilityZones: string[];
    lambdaDbSgId?: string;
    dbProps?: DbProps;
    defaultLambdaDurationSeconds?: number;
    logsDestinationArn: string;
    memorySize?: number,
    runtime?: Runtime;
}

declare interface DbProps {
    username: string;
    password: string;
    uri?: string;
    ro_uri?: string;
}

/**
 * Creates a base configuration for a Lambda that uses an RDS database
 * @param vpc "Private" Lambdas are associated with a VPC
 * @param lambdaDbSg Security Group shared by Lambda and RDS
 * @param props Database connection properties for the Lambda
 * @param config Lambda configuration
 */
export function dbLambdaConfiguration(
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: LambdaConfiguration,
    config: FunctionParameters): FunctionProps {

    return {
        runtime: props.runtime || Runtime.NODEJS_12_X,
        memorySize: props.memorySize || config.memorySize || 1024,
        functionName: config.functionName,
        code: config.code,
        role: config.role,
        handler: config.handler,
        timeout: Duration.seconds(props.defaultLambdaDurationSeconds || 60),
        environment: config.environment || {
            DB_USER: props.dbProps?.username,
            DB_PASS: props.dbProps?.password,
            DB_URI: config.readOnly ? props.dbProps?.ro_uri : props.dbProps?.uri
        },
        logRetention: RetentionDays.ONE_YEAR,
        vpc: vpc,
        vpcSubnets: {
            subnets: vpc.privateSubnets
        },
        securityGroup: lambdaDbSg,
        reservedConcurrentExecutions: config.reservedConcurrentExecutions
    };
}

export function defaultLambdaConfiguration(config: FunctionParameters): FunctionProps {
    return {
        runtime: Runtime.NODEJS_12_X,
        memorySize: config.memorySize ?? 1024,
        functionName: config.functionName,
        handler: config.handler,
        environment: config.environment ?? {},
        logRetention: RetentionDays.ONE_YEAR,
        reservedConcurrentExecutions: config.reservedConcurrentExecutions,
        code: config.code,
        role: config.role,
        timeout: Duration.seconds(config.timeout || 60),
    };
}

interface FunctionParameters {
    memorySize?: number,
    timeout?: number;
    functionName: string,
    code: Code,
    handler: string,
    readOnly?: boolean,
    environment?: any
    reservedConcurrentExecutions?: number;
    role?: Role;
    vpc?: IVpc
    vpcSubnets: any
}
