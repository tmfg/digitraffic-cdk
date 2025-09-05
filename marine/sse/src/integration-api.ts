import { databaseFunctionProps } from "@digitraffic/common/dist/aws/infra/stack/lambda-configs";
import { createLambdaLogGroup } from "@digitraffic/common/dist/aws/infra/stack/lambda-log-group";
import { createRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import {
  addDefaultValidator,
  addServiceModel,
} from "@digitraffic/common/dist/utils/api-model";
import type {
  IModel,
  IntegrationResponse,
  Resource,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import type { ISecret } from "aws-cdk-lib/aws-secretsmanager";

import {
  DigitrafficMethodResponse,
  MessageModel,
} from "@digitraffic/common/dist/aws/infra/api/response";
import {
  defaultIntegration,
  getResponse,
  RESPONSE_200_OK,
} from "@digitraffic/common/dist/aws/infra/api/responses";
import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { createDefaultUsagePlan } from "@digitraffic/common/dist/aws/infra/usage-plans";
import {
  BAD_REQUEST_MESSAGE,
  ERROR_MESSAGE,
} from "@digitraffic/common/dist/aws/types/errors";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import * as ApiResponseSchema from "./model/api-response-schema.js";
import * as SseSchema from "./model/sse-schema.js";

export function createIntegrationApiAndHandlerLambda(
  secret: ISecret,
  stack: DigitrafficStack,
): void {
  const integrationApi: RestApi = createRestApi(
    stack,
    "SSE-Integration",
    "SSE Data Integration API",
  );

  const sseModel = addServiceModel("Sse", integrationApi, SseSchema.Sse);
  const okResponseModel = addServiceModel(
    "OkResponseModel",
    integrationApi,
    ApiResponseSchema.OkResponse,
  );
  const errorResponseModel = integrationApi.addModel(
    "ErrorResponseModel",
    MessageModel,
  );

  const apiResource = createUpdateSseApiGatewayResource(integrationApi);
  const updateSseDataLambda = createUpdateRequestHandlerLambda(
    apiResource,
    sseModel,
    okResponseModel,
    errorResponseModel,
    stack,
  );
  secret.grantRead(updateSseDataLambda);

  createDefaultUsagePlan(
    integrationApi,
    "SSE - Sea State Estimate Integration",
  );
}

function createUpdateSseApiGatewayResource(integrationApi: RestApi): Resource {
  const apiResource = integrationApi.root.addResource("sse").addResource("v1")
    .addResource("update");

  addDefaultValidator(integrationApi);
  return apiResource;
}

const RESPONSE_400_BAD_REQUEST: IntegrationResponse = {
  statusCode: "400",
  selectionPattern: `.*${BAD_REQUEST_MESSAGE}.*`,
  responseTemplates: {
    "application/json":
      '{ "message" : "Bad request. $util.parseJson($input.path(\'$.errorMessage\')).errorMessage" }',
  },
};

const RESPONSE_500_SERVER_ERROR: IntegrationResponse = {
  statusCode: "500",
  selectionPattern: `.*${ERROR_MESSAGE}.*`,
  responseTemplates: {
    "application/json":
      '{ "message" : "Internal server error. $util.parseJson($input.path(\'$.errorMessage\')).errorMessage" }',
  },
};

function createUpdateRequestHandlerLambda(
  requests: Resource,
  sseRequestModel: IModel,
  okResponseModel: IModel,
  errorResponseModel: IModel,
  stack: DigitrafficStack,
): MonitoredFunction {
  const lambdaFunctionName = "SSE-UpdateSseData";
  const environment = stack.createDefaultLambdaEnvironment("SSE");
  const logGroup = createLambdaLogGroup(stack, lambdaFunctionName);

  const updateSseDataLambda = MonitoredFunction.create(
    stack,
    lambdaFunctionName,
    databaseFunctionProps(
      stack,
      environment,
      lambdaFunctionName,
      "lambda-update-sse-data",
      logGroup,
      {
        singleLambda: true,
        reservedConcurrentExecutions: 10,
        memorySize: 256,
      },
    ),
  );

  // eslint-disable-next-line deprecation/deprecation
  const lambdaIntegration = defaultIntegration(updateSseDataLambda, {
    responses: [
      getResponse(RESPONSE_200_OK),
      getResponse(RESPONSE_400_BAD_REQUEST),
      getResponse(RESPONSE_500_SERVER_ERROR),
    ],
  });

  requests.addMethod("POST", lambdaIntegration, {
    apiKeyRequired: true,
    requestModels: {
      "application/json": sseRequestModel,
    },
    methodResponses: [
      DigitrafficMethodResponse.response200(
        okResponseModel,
        MediaType.APPLICATION_JSON,
      ),
      DigitrafficMethodResponse.response400(
        errorResponseModel,
        MediaType.APPLICATION_JSON,
      ),
      DigitrafficMethodResponse.response500(
        errorResponseModel,
        MediaType.APPLICATION_JSON,
      ),
    ],
  });

  return updateSseDataLambda;
}
