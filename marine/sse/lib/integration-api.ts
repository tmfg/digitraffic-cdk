import {Resource, RestApi} from '@aws-cdk/aws-apigateway';
import {Construct, Duration, Stack} from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import * as Lambda from '@aws-cdk/aws-lambda';
import {dbLambdaConfiguration} from 'digitraffic-common/stack/lambda-configs';
import {createRestApi} from 'digitraffic-common/api/rest_apis';
import {addDefaultValidator, addServiceModel} from "digitraffic-common/api/utils";
import {getFullEnv} from "digitraffic-common/stack/stack-util";
import * as cloudwatch from "@aws-cdk/aws-cloudwatch";
import {Topic} from "@aws-cdk/aws-sns";
import {SnsAction} from "@aws-cdk/aws-cloudwatch-actions";
import {ISecret} from "@aws-cdk/aws-secretsmanager";

import * as SseSchema from "./model/sse-schema";
import {createDefaultUsagePlan} from "digitraffic-common/stack/usage-plans";
import {createSubscription} from "digitraffic-common/stack/subscription";
import {AppProps} from "./app-props";
import {KEY_SECRET_ID} from "./lambda/update-sse-data/lambda-update-sse-data";
import apigateway = require('@aws-cdk/aws-apigateway');


export function createIntegrationApiAndHandlerLambda(
    secret: ISecret,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AppProps,
    stack: Stack) {

    const integrationApi: RestApi = createRestApi(stack,
        'SSE-Integration',
        'SSE Data Integration API');

    addServiceModel("Sse", integrationApi, SseSchema.Sse);

    const apiResource = createUpdateSseApiGatewayResource(stack, integrationApi);
    const updateSseDataLambda = createUpdateRequestHandlerLambda(apiResource, vpc, lambdaDbSg, props, stack);
    secret.grantRead(updateSseDataLambda);

    createDefaultUsagePlan(integrationApi, 'SSE - Sea State Estimate Integration');
}

function createUpdateSseApiGatewayResource(
    stack: Construct,
    integrationApi: RestApi): Resource {

    const apiResource = integrationApi.root
        .addResource('sse')
        .addResource('v1')
        .addResource('update');

    addDefaultValidator(integrationApi);
    return apiResource;
}

function createUpdateRequestHandlerLambda(
    requests: apigateway.Resource,
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    appProps: AppProps,
    stack: Stack
) {
    const lambdaFunctionName = 'SSE-UpdateSseData';
    const lambdaEnv: any = {};
    lambdaEnv[KEY_SECRET_ID] = appProps.secretId;

    const updateRequestsHandler = new Lambda.Function(stack, lambdaFunctionName, dbLambdaConfiguration(vpc, lambdaDbSg, appProps, {
        functionName: lambdaFunctionName,
        code: new Lambda.AssetCode('dist/lambda'),
        handler: 'lambda-update-sse-data.handler',
        memorySize: appProps.memorySize,
        environment: lambdaEnv
    }));

    requests.addMethod("POST", new apigateway.LambdaIntegration(updateRequestsHandler), {
        apiKeyRequired: true,
    });
    // Create log subscription
    createSubscription(updateRequestsHandler, lambdaFunctionName, appProps.logsDestinationArn, stack);
    createAlarm(updateRequestsHandler, appProps.errorNotificationSnsTopicArn, stack);
    return updateRequestsHandler;
}

function createAlarm(updateRequestHandlerLambda: Lambda.Function, errorNotificationSnsTopicArn: string, stack: Stack) {

    const fullEnv = getFullEnv(stack);
    // Raise an alarm if we have more than 1 errors in last day
    const topic = Topic.fromTopicArn(stack, 'SSE-UpdateSseData-Alarm-ErrorTopic', errorNotificationSnsTopicArn)
    new cloudwatch.Alarm(stack, "SSE-UpdateSseData-Alarm-Error", {
        alarmName: updateRequestHandlerLambda.functionName + '-ErrorAlert-' + fullEnv,
        alarmDescription: `Environment: ${fullEnv}. Error in handling of incoming Sea State Estimate (SSE) data.`,
        metric: updateRequestHandlerLambda.metricErrors().with({period: Duration.minutes(3)}),
        threshold: 1,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    }).addAlarmAction(new SnsAction(topic));

    // Raise alarm if there is more than 1 throttle in last day
    const throttleTopic = Topic.fromTopicArn(stack, 'SSE-UpdateData-Alarm-UpdateData-ThrottleTopic', errorNotificationSnsTopicArn)
    new cloudwatch.Alarm(stack, "SSE-UpdateData-Alarm-UpdateData-Throttle", {
        alarmName: updateRequestHandlerLambda.functionName + '-ThrottleAlert-' + fullEnv,
        alarmDescription: `Environment: ${fullEnv}. Lambda throttles while handling incoming Sea State Estimate (SSE) data`,
        metric: updateRequestHandlerLambda.metricThrottles().with({period: Duration.hours(1)}),
        threshold: 1,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    }).addAlarmAction(new SnsAction(throttleTopic));
}
