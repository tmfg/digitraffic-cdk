import { Resource, RestApi } from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {
    defaultLambdaConfiguration,
    LambdaEnvironment,
} from "@digitraffic/common/dist/aws/infra/stack/lambda-configs";
import { createRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import { Queue } from "aws-cdk-lib/aws-sqs";
import {
    addDefaultValidator,
    addServiceModel,
} from "@digitraffic/common/dist/utils/api-model";
import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";

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
import { createDefaultUsagePlan } from "@digitraffic/common/dist/aws/infra/usage-plans";
import { createSubscription } from "@digitraffic/common/dist/aws/infra/stack/subscription";
import { AppProps } from "./app-props";
import {
    ManagedPolicy,
    PolicyStatement,
    Role,
    ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { MaintenanceTrackingEnvKeys } from "./keys";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import apigateway = require("aws-cdk-lib/aws-apigateway");
import { Construct } from "constructs";

export function createIntegrationApiAndHandlerLambda(
    queue: Queue,
    sqsExtendedMessageBucketArn: string,
    props: AppProps,
    stack: DigitrafficStack
) {
    const integrationApi = createRestApi(
        stack,
        "MaintenanceTracking-Integration",
        "Maintenance Tracking Integration API"
    );

    addServiceModelToIntegrationApi(integrationApi);

    const apiResource = createUpdateMaintenanceTrackingApiGatewayResource(
        stack,
        integrationApi
    );
    createUpdateRequestHandlerLambda(
        apiResource,
        queue,
        sqsExtendedMessageBucketArn,
        props,
        stack
    );
    createDefaultUsagePlan(integrationApi, "Maintenance Tracking Integration");
}

function addServiceModelToIntegrationApi(integrationApi: RestApi) {
    const tunnisteModel = addServiceModel("Tunniste", integrationApi, Tunniste);
    const organisaatioModel = addServiceModel(
        "Organisaatio",
        integrationApi,
        Organisaatio
    );
    const otsikkoModel = addServiceModel(
        "Otsikko",
        integrationApi,
        createSchemaOtsikko(
            organisaatioModel.modelReference,
            tunnisteModel.modelReference
        )
    );
    const koordinaattisijaintiModel = addServiceModel(
        "Koordinaattisijainti",
        integrationApi,
        Koordinaattisijainti
    );
    const viivageometriasijaintiModel = addServiceModel(
        "Viivageometriasijainti",
        integrationApi,
        Viivageometriasijainti
    );
    const geometriaSijaintiModel = addServiceModel(
        "GeometriaSijainti",
        integrationApi,
        createSchemaGeometriaSijainti(
            koordinaattisijaintiModel.modelReference,
            viivageometriasijaintiModel.modelReference
        )
    );
    const havaintoSchema = createSchemaHavainto(
        geometriaSijaintiModel.modelReference
    );
    addServiceModel("Havainto", integrationApi, havaintoSchema);

    addServiceModel(
        "TyokoneenseurannanKirjaus",
        integrationApi,
        createSchemaTyokoneenseurannanKirjaus(
            otsikkoModel.modelReference,
            havaintoSchema
        )
    );
}

function createUpdateMaintenanceTrackingApiGatewayResource(
    stack: Construct,
    integrationApi: RestApi
): Resource {
    const apiResource = integrationApi.root
        .addResource("maintenance-tracking")
        .addResource("v1")
        .addResource("update");

    addDefaultValidator(integrationApi);
    return apiResource;
}

function createUpdateRequestHandlerLambda(
    requests: apigateway.Resource,
    queue: Queue,
    sqsExtendedMessageBucketArn: string,
    appProps: AppProps,
    stack: DigitrafficStack
) {
    const lambdaFunctionName = "MaintenanceTracking-UpdateQueue";

    const lambdaEnv: LambdaEnvironment = {};
    lambdaEnv[MaintenanceTrackingEnvKeys.SQS_BUCKET_NAME] =
        appProps.sqsMessageBucketName;
    lambdaEnv[MaintenanceTrackingEnvKeys.SQS_QUEUE_URL] = queue.queueUrl;

    const lambdaRole = createLambdaRoleWithWriteToSqsAndS3Policy(
        stack,
        queue.queueArn,
        sqsExtendedMessageBucketArn
    );
    const updateRequestsHandler = MonitoredFunction.create(
        stack,
        lambdaFunctionName,
        defaultLambdaConfiguration({
            functionName: lambdaFunctionName,
            code: new lambda.AssetCode("dist/lambda/update-queue"),
            handler: "lambda-update-queue.handler",
            reservedConcurrentExecutions: 100,
            timeout: 60,
            environment: lambdaEnv,
            role: lambdaRole,
            memorySize: 256,
        })
    );

    requests.addMethod(
        "POST",
        new apigateway.LambdaIntegration(updateRequestsHandler),
        {
            apiKeyRequired: true,
        }
    );
    // Create log subscription
    createSubscription(
        updateRequestsHandler,
        lambdaFunctionName,
        appProps.logsDestinationArn,
        stack
    );
}

function createLambdaRoleWithWriteToSqsAndS3Policy(
    stack: Construct,
    sqsArn: string,
    sqsExtendedMessageBucketArn: string
) {
    const lambdaRole = new Role(stack, `SendMessageToSqsRole`, {
        assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
        roleName: `SendMessageToSqsRole`,
    });

    const sqsPolicyStatement = new PolicyStatement();
    sqsPolicyStatement.addActions("sqs:SendMessage");
    sqsPolicyStatement.addResources(sqsArn);

    const s3PolicyStatement = new PolicyStatement();
    s3PolicyStatement.addActions("s3:PutObject");
    s3PolicyStatement.addActions("s3:PutObjectAcl");
    s3PolicyStatement.addResources(sqsExtendedMessageBucketArn + "/*");

    lambdaRole.addManagedPolicy(
        ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AWSLambdaBasicExecutionRole"
        )
    );
    lambdaRole.addToPolicy(sqsPolicyStatement);
    lambdaRole.addToPolicy(s3PolicyStatement);

    return lambdaRole;
}
