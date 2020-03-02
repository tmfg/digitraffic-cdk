import {FunctionProps, Runtime} from '@aws-cdk/aws-lambda';
import {Duration} from "@aws-cdk/core";
import {IVpc, ISecurityGroup} from "@aws-cdk/aws-ec2";
import {RetentionDays} from '@aws-cdk/aws-logs';

// Base configuration for a database-reading Lambda function
export function dbLambdaConfiguration(
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AtonFaultsProps,
    config: object): FunctionProps {

    return <FunctionProps> Object.assign({}, {
        runtime: Runtime.NODEJS_12_X,
        memorySize: 1024,
        timeout: Duration.seconds(props.defaultLambdaDurationSeconds),
        environment: {
            DB_USER: props.dbProps.username,
            DB_PASS: props.dbProps.password,
            DB_URI: props.dbProps.uri
        },
        logRetention: RetentionDays.ONE_YEAR,
        vpc: vpc,
        vpcSubnets: vpc.privateSubnets,
        securityGroup: lambdaDbSg
    }, config);
}