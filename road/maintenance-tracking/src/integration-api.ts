import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { createRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import { type DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { createDefaultUsagePlan } from "@digitraffic/common/dist/aws/infra/usage-plans";
import {
  addDefaultValidator,
  addServiceModel,
} from "@digitraffic/common/dist/utils/api-model";
import { type Resource, type RestApi } from "aws-cdk-lib/aws-apigateway";
import {
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { type Queue } from "aws-cdk-lib/aws-sqs";
import { type Construct } from "constructs";
import { MaintenanceTrackingEnvKeys } from "./keys.js";
import { type MaintenanceTrackingStackConfiguration } from "./maintenance-tracking-stack-configuration.js";

import {
  createSchemaGeometriaSijainti,
  createSchemaHavainto,
  createSchemaOtsikko,
  createSchemaTyokoneenseurannanKirjaus,
  Koordinaattisijainti,
  Organisaatio,
  Tunniste,
  Viivageometriasijainti,
} from "./model/maintenance-tracking-schema.js";
import apigateway = require("aws-cdk-lib/aws-apigateway");

export function createIntegrationApiAndHandlerLambda(
  queue: Queue,
  sqsExtendedMessageBucketArn: string,
  stackConfiguration: MaintenanceTrackingStackConfiguration,
  stack: DigitrafficStack,
): void {
  const integrationApi = createRestApi(
    stack,
    "MaintenanceTracking-Integration",
    "Maintenance Tracking Integration API",
  );

  addServiceModelToIntegrationApi(integrationApi);

  const apiResource = createUpdateMaintenanceTrackingApiGatewayResource(
    integrationApi,
  );
  createUpdateRequestHandlerLambda(
    apiResource,
    queue,
    sqsExtendedMessageBucketArn,
    stackConfiguration,
    stack,
  );
  createDefaultUsagePlan(integrationApi, "Maintenance Tracking Integration");
}

function addServiceModelToIntegrationApi(integrationApi: RestApi): void {
  const tunnisteModel = addServiceModel("Tunniste", integrationApi, Tunniste);
  const organisaatioModel = addServiceModel(
    "Organisaatio",
    integrationApi,
    Organisaatio,
  );
  const s = createSchemaOtsikko(
    organisaatioModel.modelReference,
    tunnisteModel.modelReference,
  );
  const otsikkoModel = addServiceModel("Otsikko", integrationApi, s);
  const koordinaattisijaintiModel = addServiceModel(
    "Koordinaattisijainti",
    integrationApi,
    Koordinaattisijainti,
  );
  const viivageometriasijaintiModel = addServiceModel(
    "Viivageometriasijainti",
    integrationApi,
    Viivageometriasijainti,
  );
  const geometriaSijaintiModel = addServiceModel(
    "GeometriaSijainti",
    integrationApi,
    createSchemaGeometriaSijainti(
      koordinaattisijaintiModel.modelReference,
      viivageometriasijaintiModel.modelReference,
    ),
  );
  const havaintoSchema = createSchemaHavainto(
    geometriaSijaintiModel.modelReference,
  );
  addServiceModel("Havainto", integrationApi, havaintoSchema);

  addServiceModel(
    "TyokoneenseurannanKirjaus",
    integrationApi,
    createSchemaTyokoneenseurannanKirjaus(
      otsikkoModel.modelReference,
      havaintoSchema,
    ),
  );
}

function createUpdateMaintenanceTrackingApiGatewayResource(
  integrationApi: RestApi,
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
  stackConfiguration: MaintenanceTrackingStackConfiguration,
  stack: DigitrafficStack,
): void {
  const lambdaEnv = stack.createLambdaEnvironment();
  lambdaEnv[MaintenanceTrackingEnvKeys.SQS_BUCKET_NAME] =
    stackConfiguration.sqsMessageBucketName;
  lambdaEnv[MaintenanceTrackingEnvKeys.SQS_QUEUE_URL] = queue.queueUrl;

  const lambdaRole = createLambdaRoleWithWriteToSqsAndS3Policy(
    stack,
    queue.queueArn,
    sqsExtendedMessageBucketArn,
  );

  const updateRequestsHandler = MonitoredFunction.createV2(
    stack,
    "update-queue",
    lambdaEnv,
    {
      reservedConcurrentExecutions: 100,
      timeout: 60,
      role: lambdaRole,
      memorySize: 256,
    },
  );

  requests.addMethod(
    "POST",
    new apigateway.LambdaIntegration(updateRequestsHandler),
    {
      apiKeyRequired: true,
    },
  );
}

function createLambdaRoleWithWriteToSqsAndS3Policy(
  stack: Construct,
  sqsArn: string,
  sqsExtendedMessageBucketArn: string,
): Role {
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
      "service-role/AWSLambdaBasicExecutionRole",
    ),
  );
  lambdaRole.addManagedPolicy(
    ManagedPolicy.fromAwsManagedPolicyName(
      "service-role/AWSLambdaVPCAccessExecutionRole",
    ),
  );

  lambdaRole.addToPolicy(sqsPolicyStatement);
  lambdaRole.addToPolicy(s3PolicyStatement);

  return lambdaRole;
}
