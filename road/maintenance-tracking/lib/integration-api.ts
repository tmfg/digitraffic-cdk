import {Resource, RestApi} from '@aws-cdk/aws-apigateway';
import {Construct, Stack, Duration} from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import * as lambda from '@aws-cdk/aws-lambda';
import {defaultLambdaConfiguration} from 'digitraffic-common/stack/lambda-configs';
import {createRestApi} from 'digitraffic-common/api/rest_apis';
import {Queue} from '@aws-cdk/aws-sqs';
import {addDefaultValidator, addServiceModel} from "digitraffic-common/api/utils";
import {getFullEnv} from "digitraffic-common/stack/stack-util";
import * as cloudwatch from "@aws-cdk/aws-cloudwatch";
import {Topic} from "@aws-cdk/aws-sns";
import {SnsAction} from "@aws-cdk/aws-cloudwatch-actions";


import {
    createSchemaGeometriaSijainti,
    createSchemaHavainto,
    createSchemaOtsikko,
    createSchemaTyokoneenseurannanKirjaus,
    Koordinaattisijainti,
    Organisaatio,
    Tunniste,
    Viivageometriasijainti,
} from "./model/maintenance-tracking-schema";
import {createDefaultUsagePlan} from "digitraffic-common/stack/usage-plans";
import {createSubscription} from "digitraffic-common/stack/subscription";
import {AppProps} from "./app-props";
import {ManagedPolicy, PolicyStatement, Role, ServicePrincipal} from "@aws-cdk/aws-iam";
import apigateway = require('@aws-cdk/aws-apigateway');
import {MaintenanceTrackingEnvKeys} from "./keys";

export function createIntegrationApiAndHandlerLambda(
    queue: Queue,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    sqsExtendedMessageBucketArn: string,
    props: AppProps,
    stack: Stack) {

    const integrationApi = createRestApi(stack,
        'MaintenanceTracking-Integration',
        'Maintenance Tracking Integration API');

    addServiceModelToIntegrationApi(integrationApi);

    const apiResource = createUpdateMaintenanceTrackingApiGatewayResource(stack, integrationApi);
    createUpdateRequestHandlerLambda(apiResource, vpc, lambdaDbSg, queue, sqsExtendedMessageBucketArn, props, stack);
    createDefaultUsagePlan(integrationApi, 'Maintenance Tracking Integration');
}

function addServiceModelToIntegrationApi(integrationApi: RestApi) {
    const tunnisteModel = addServiceModel("Tunniste", integrationApi, Tunniste);
    const organisaatioModel = addServiceModel("Organisaatio", integrationApi, Organisaatio);
    const otsikkoModel = addServiceModel("Otsikko", integrationApi,
        createSchemaOtsikko(organisaatioModel.modelReference,
            tunnisteModel.modelReference));
    const koordinaattisijaintiModel = addServiceModel("Koordinaattisijainti", integrationApi, Koordinaattisijainti);
    const viivageometriasijaintiModel = addServiceModel("Viivageometriasijainti", integrationApi, Viivageometriasijainti);
    const geometriaSijaintiModel =  addServiceModel("GeometriaSijainti", integrationApi,
        createSchemaGeometriaSijainti(koordinaattisijaintiModel.modelReference,
            viivageometriasijaintiModel.modelReference));
    const havaintoSchema = createSchemaHavainto(geometriaSijaintiModel.modelReference);
    addServiceModel("Havainto", integrationApi, havaintoSchema);

    addServiceModel("TyokoneenseurannanKirjaus", integrationApi,
                    createSchemaTyokoneenseurannanKirjaus(otsikkoModel.modelReference, havaintoSchema));
}

function createUpdateMaintenanceTrackingApiGatewayResource(
    stack: Construct,
    integrationApi: RestApi) : Resource {

    const apiResource = integrationApi.root
        .addResource('maintenance-tracking')
        .addResource('v1')
        .addResource('update');

    addDefaultValidator(integrationApi);
    return apiResource;
}

function createUpdateRequestHandlerLambda(
    requests: apigateway.Resource,
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    queue : Queue,
    sqsExtendedMessageBucketArn: string,
    appProps: AppProps,
    stack: Stack
) {
    const lambdaFunctionName = 'MaintenanceTracking-UpdateQueue';

    const lambdaEnv: any = {};
    lambdaEnv[MaintenanceTrackingEnvKeys.SQS_BUCKET_NAME] = appProps.sqsMessageBucketName;
    lambdaEnv[MaintenanceTrackingEnvKeys.SQS_QUEUE_URL] = queue.queueUrl;

    const lambdaRole = createLambdaRoleWithWriteToSqsAndS3Policy(stack, queue.queueArn, sqsExtendedMessageBucketArn);
    const updateRequestsHandler = new lambda.Function(stack, lambdaFunctionName, defaultLambdaConfiguration({
        functionName: lambdaFunctionName,
        code: new lambda.AssetCode('dist/lambda/update-queue'),
        handler: 'lambda-update-queue.handler',
        // reservedConcurrentExecutions: appProps.sqsProcessLambdaConcurrentExecutions,
        environment: lambdaEnv,
        role: lambdaRole,
        memorySize: 256
    }));

    requests.addMethod("POST", new apigateway.LambdaIntegration(updateRequestsHandler), {
        apiKeyRequired: true,
    });
    // Create log subscription
    createSubscription(updateRequestsHandler, lambdaFunctionName, appProps.logsDestinationArn, stack);
    createAlarm(updateRequestsHandler, appProps.errorNotificationSnsTopicArn, appProps.sqsDlqBucketName, stack);
}

function createLambdaRoleWithWriteToSqsAndS3Policy(stack: Construct, sqsArn: string, sqsExtendedMessageBucketArn: string) {
    const lambdaRole = new Role(stack, `SendMessageToSqsRole`, {
        assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
        roleName: `SendMessageToSqsRole`
    });

    const sqsPolicyStatement = new PolicyStatement();
    sqsPolicyStatement.addActions("sqs:SendMessage");
    sqsPolicyStatement.addResources(sqsArn)

    const s3PolicyStatement = new PolicyStatement();
    s3PolicyStatement.addActions('s3:PutObject');
    s3PolicyStatement.addActions('s3:PutObjectAcl');
    s3PolicyStatement.addResources(sqsExtendedMessageBucketArn + '/*');

    lambdaRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"));
    lambdaRole.addToPolicy(sqsPolicyStatement);
    lambdaRole.addToPolicy(s3PolicyStatement);

    return lambdaRole;
}

function createAlarm(updateRequestHandlerLambda: lambda.Function, errorNotificationSnsTopicArn: string, dlqBucketName: string, stack: Stack) {

    const fullEnv = getFullEnv(stack);
    // Raise an alarm if we have more than 1 errors in last day
    const topic = Topic.fromTopicArn(stack, 'MaintenanceTrackingAlarmUpdateSqsErrorTopic', errorNotificationSnsTopicArn)
    new cloudwatch.Alarm(stack, "MaintenanceTrackingAlarmUpdateSqs", {
        alarmName: updateRequestHandlerLambda.functionName + '-ErrorAlert-' + fullEnv,
        alarmDescription: `Environment: ${fullEnv}. Error in handling of incoming maintenance tracking messages from HARJA.`,
        metric: updateRequestHandlerLambda.metricErrors().with({ period: Duration.days(1) }),
        threshold: 1,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    }).addAlarmAction(new SnsAction(topic));

    // Raise alarm if there is more than 1 throttle in last day
    const throttleTopic = Topic.fromTopicArn(stack, 'MaintenanceTrackingAlarmUpdateSqsThrottleTopic', errorNotificationSnsTopicArn)
    new cloudwatch.Alarm(stack, "MaintenanceTrackingAlarmUpdateThrottle", {
        alarmName: updateRequestHandlerLambda.functionName + '-ThrottleAlert-' + fullEnv,
        alarmDescription: `Environment: ${fullEnv}. Lambda throttles while handling incoming maintenance tracking messages from HARJA`,
        metric: updateRequestHandlerLambda.metricThrottles().with({ period: Duration.days(1) }),
        threshold: 1,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    }).addAlarmAction(new SnsAction(throttleTopic));
}
