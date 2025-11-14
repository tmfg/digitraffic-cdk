import { DigitrafficIntegration } from "@digitraffic/common/dist/aws/infra/api/integration";
import { DigitrafficMethodResponse } from "@digitraffic/common/dist/aws/infra/api/response";
import { attachQueueToApiGatewayResource } from "@digitraffic/common/dist/aws/infra/sqs-integration";
import { createLambdaLogGroup } from "@digitraffic/common/dist/aws/infra/stack/lambda-log-group";
import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest-api";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { createDefaultUsagePlan } from "@digitraffic/common/dist/aws/infra/usage-plans";
import { Duration } from "aws-cdk-lib";
import type { Resource } from "aws-cdk-lib/aws-apigateway";
import {
  EndpointType,
  Model,
  RequestValidator,
} from "aws-cdk-lib/aws-apigateway";
import { AssetCode, Runtime } from "aws-cdk-lib/aws-lambda";
import type { Queue } from "aws-cdk-lib/aws-sqs";
import { RamiEnvKeys } from "./keys.js";

export class IntegrationApi {
  readonly integrationApi: DigitrafficRestApi;
  readonly apiKeyId: string;

  constructor(
    stack: DigitrafficStack,
    rosmSqs: Queue,
    smSqs: Queue,
    dlq: Queue,
  ) {
    const apiName = "RAMI integration API";
    this.integrationApi = new DigitrafficRestApi(
      stack,
      "RAMI-integration",
      apiName,
      undefined,
      {
        endpointTypes: [EndpointType.REGIONAL],
      },
    );

    this.apiKeyId = createDefaultUsagePlan(this.integrationApi, apiName).keyId;
    this.integrationApi.apiKeyIds.push(this.apiKeyId);

    const resource = this.integrationApi.root
      .addResource("api")
      .addResource("v1")
      .addResource("rami")
      .addResource("incoming");

    this.createUploadRosmMessageResource(stack, resource, rosmSqs, dlq);
    this.createUploadSmMessageResource(stack, resource, smSqs);
  }

  createUploadRosmMessageResource(
    stack: DigitrafficStack,
    resource: Resource,
    sqs: Queue,
    dlq: Queue,
  ): MonitoredFunction {
    const activeResource = resource.addResource("message");
    const functionName = "RAMI-UploadRamiRosmMessage";
    const logGroup = createLambdaLogGroup({ stack, functionName });
    const uploadLambda = MonitoredFunction.create(stack, functionName, {
      functionName,
      timeout: Duration.seconds(15),
      memorySize: 256,
      code: new AssetCode("dist/lambda/upload-rosm-message"),
      handler: "upload-rosm-message.handler",
      logGroup: logGroup,
      runtime: Runtime.NODEJS_20_X,
      reservedConcurrentExecutions: 20,
      environment: {
        [RamiEnvKeys.ROSM_SQS_URL]: sqs.queueUrl,
        [RamiEnvKeys.DLQ_URL]: dlq.queueUrl,
      },
    });

    sqs.grantSendMessages(uploadLambda);
    dlq.grantSendMessages(uploadLambda);

    const uploadRamiMessageIntegration = new DigitrafficIntegration(
      uploadLambda,
    ).build();

    activeResource.addMethod("POST", uploadRamiMessageIntegration, {
      apiKeyRequired: true,
      methodResponses: [
        DigitrafficMethodResponse.response200(Model.EMPTY_MODEL),
        DigitrafficMethodResponse.response400(),
      ],
    });

    return uploadLambda;
  }

  createUploadSmMessageResource(
    stack: DigitrafficStack,
    resource: Resource,
    dlq: Queue,
  ): void {
    const activeResource = resource.addResource("sm");

    const requestValidator = new RequestValidator(stack, "RequestValidator", {
      validateRequestBody: false,
      validateRequestParameters: false,
      requestValidatorName: "StopMonitoringIntegrationRequestValidator",
      restApi: this.integrationApi,
    });

    attachQueueToApiGatewayResource(
      stack,
      dlq,
      activeResource,
      requestValidator,
      "StopMonitoring",
      true,
    );
  }
}
