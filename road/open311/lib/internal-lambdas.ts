import * as events from '@aws-cdk/aws-events';
import * as lambda from '@aws-cdk/aws-lambda';
import * as ec2 from '@aws-cdk/aws-ec2';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';
import {Construct, Duration} from '@aws-cdk/core';
import {dbLambdaConfiguration} from 'digitraffic-common/stack/lambda-configs';
import {createSubscription} from "digitraffic-common/stack/subscription";
import {LambdaEnvironment} from "digitraffic-common/model/lambda-environment";

// returns lambda names for log group subscriptions
export function create(
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    stack: Construct,
    props: Props): void {

    const updateServicesLambda = createUpdateServicesLambda(vpc, lambdaDbSg, props, stack);
    const updateStatesLambda = createUpdateStatesLambda(vpc, lambdaDbSg, props, stack);
    const updateSubjectsLambda = createUpdateSubjectsLambda(vpc, lambdaDbSg, props, stack);
    const updateSubSubjectsLambda = createUpdateSubSubjectsLambda(vpc, lambdaDbSg, props, stack);

    const updateMetaDataRuleId = 'Open311-UpdateMetadataRule';
    const updateMetaDataRule = new events.Rule(stack, updateMetaDataRuleId, {
        ruleName: updateMetaDataRuleId,
        schedule: events.Schedule.rate(Duration.days(1))
    });
    updateMetaDataRule.addTarget(new LambdaFunction(updateServicesLambda));
    updateMetaDataRule.addTarget(new LambdaFunction(updateStatesLambda));
    updateMetaDataRule.addTarget(new LambdaFunction(updateSubjectsLambda));
    updateMetaDataRule.addTarget(new LambdaFunction(updateSubSubjectsLambda));
}

function createUpdateServicesLambda(
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: Props,
    stack: Construct): lambda.Function {

    const updateServicesId = 'UpdateServices';
    const environment: LambdaEnvironment = {};
    environment.ENDPOINT_USER = props.integration.username;
    environment.ENDPOINT_PASS = props.integration.password;
    environment.ENDPOINT_URL = props.integration.url;
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: updateServicesId,
        code: new lambda.AssetCode('dist/lambda/update-services'),
        handler: 'lambda-update-services.handler',
        environment
    });
    const updateServicesLambda = new lambda.Function(stack, updateServicesId, lambdaConf);
    createSubscription(updateServicesLambda, updateServicesId, props.logsDestinationArn, stack);
    return updateServicesLambda;
}

function createUpdateStatesLambda(
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: Props,
    stack: Construct): lambda.Function {

    const updateStatesId = 'UpdateStates';
    const environment: LambdaEnvironment = {};
    environment.ENDPOINT_USER = props.integration.username;
    environment.ENDPOINT_PASS = props.integration.password;
    environment.ENDPOINT_URL = props.integration.url;
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: updateStatesId,
        code: new lambda.AssetCode('dist/lambda/update-states'),
        handler: 'lambda-update-states.handler',
        environment
    });
    const updateStatesLambda = new lambda.Function(stack, updateStatesId, lambdaConf);
    createSubscription(updateStatesLambda, updateStatesId, props.logsDestinationArn, stack);
    return updateStatesLambda;
}

function createUpdateSubjectsLambda(
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: Props,
    stack: Construct): lambda.Function {

    const updateSubjectsId = 'Open311-UpdateSubjects'
    const environment: LambdaEnvironment = {};
    environment.ENDPOINT_USER = props.integration.username;
    environment.ENDPOINT_PASS = props.integration.password;
    environment.ENDPOINT_URL = props.integration.url;
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: updateSubjectsId,
        code: new lambda.AssetCode('dist/lambda/update-subjects'),
        handler: 'lambda-update-subjects.handler',
        environment
    });
    const updateSubjectsLambda = new lambda.Function(stack, updateSubjectsId, lambdaConf);
    createSubscription(updateSubjectsLambda, updateSubjectsId, props.logsDestinationArn, stack);
    return updateSubjectsLambda;
}

function createUpdateSubSubjectsLambda(
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: Props,
    stack: Construct): lambda.Function {

    const updateSubSubjectsId = 'Open311-UpdateSubSubjects';
    const environment: LambdaEnvironment = {};
    environment.ENDPOINT_USER = props.integration.username;
    environment.ENDPOINT_PASS = props.integration.password;
    environment.ENDPOINT_URL = props.integration.url;
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: updateSubSubjectsId,
        code: new lambda.AssetCode('dist/lambda/update-subsubjects'),
        handler: 'lambda-update-subsubjects.handler',
        environment
    });
    const updateSubSubjectsLambda = new lambda.Function(stack, updateSubSubjectsId, lambdaConf);
    createSubscription(updateSubSubjectsLambda, updateSubSubjectsId, props.logsDestinationArn, stack);
    return updateSubSubjectsLambda;
}
