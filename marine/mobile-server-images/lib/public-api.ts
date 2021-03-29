import {Stack, Construct, StackProps} from '@aws-cdk/core';
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {ISecurityGroup, IVpc} from "@aws-cdk/aws-ec2";
import {MobileServerProps} from "./app-props";

export function create(
    secret: ISecret,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: MobileServerProps,
    stack: Construct) {
}
