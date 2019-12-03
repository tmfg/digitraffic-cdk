import * as lambda from '@aws-cdk/aws-lambda';
import {Duration} from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";

export function defaultLambdaConfiguration(
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: Props,
    config: object) {

    return Object.assign({}, {
        runtime: lambda.Runtime.NODEJS_10_X,
        timeout: Duration.seconds(props.defaultLambdaDurationSeconds),
        environment: {
            DB_USER: props.dbProps.username,
            DB_PASS: props.dbProps.password,
            DB_URI: props.dbProps.uri
        },
        vpc: vpc,
        vpcSubnets: vpc.privateSubnets,
        securityGroup: lambdaDbSg
    }, config);
}