import { DigitrafficIntegration } from "@digitraffic/common/dist/aws/infra/api/integration";
import { DigitrafficMethodResponse } from "@digitraffic/common/dist/aws/infra/api/response";
import {
    MonitoredDBFunction,
    MonitoredFunction
} from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { createDefaultUsagePlan } from "@digitraffic/common/dist/aws/infra/usage-plans";
import { Duration } from "aws-cdk-lib";
import { EndpointType, Model, type Resource } from "aws-cdk-lib/aws-apigateway";
import { AssetCode, Runtime } from "aws-cdk-lib/aws-lambda";
import type { Queue } from "aws-cdk-lib/aws-sqs";
import { RamiEnvKeys } from "./keys.js";

export class IntegrationApi {
    readonly integrationApi: DigitrafficRestApi;
    readonly apiKeyId: string;

    constructor(stack: DigitrafficStack, rosmSqs: Queue, smSqs: Queue, dlq: Queue) {
        const apiName = "RAMI integration API";
        this.integrationApi = new DigitrafficRestApi(stack, "RAMI-integration", apiName, undefined, {
            endpointTypes: [EndpointType.REGIONAL]
        });

        this.apiKeyId = createDefaultUsagePlan(this.integrationApi, apiName).keyId;
        this.integrationApi.apiKeyIds.push(this.apiKeyId);

        const resource = this.integrationApi.root
            .addResource("api")
            .addResource("v1")
            .addResource("rami")
            .addResource("incoming");

        this.createUploadRosmMessageResource(stack, resource, rosmSqs, dlq);
        this.createUploadSmMessageResource(stack, resource, smSqs, dlq);
    }

    createUploadRosmMessageResource(
        stack: DigitrafficStack,
        resource: Resource,
        sqs: Queue,
        dlq: Queue
    ): MonitoredDBFunction {
        const activeResource = resource.addResource("message");
        const functionName = "RAMI-UploadRamiRosmMessage";
        const uploadLambda = MonitoredFunction.create(stack, functionName, {
            functionName,
            timeout: Duration.seconds(15),
            memorySize: 256,
            code: new AssetCode("dist/lambda/upload-rosm-message"),
            handler: "upload-rosm-message.handler",
            runtime: Runtime.NODEJS_20_X,
            reservedConcurrentExecutions: 20,
            environment: { 
                [RamiEnvKeys.ROSM_SQS_URL]: sqs.queueUrl, 
                [RamiEnvKeys.DLQ_URL]: dlq.queueUrl 
            }
        });

        sqs.grantSendMessages(uploadLambda);
        dlq.grantSendMessages(uploadLambda);

        const uploadRamiMessageIntegration = new DigitrafficIntegration(uploadLambda).build();

        activeResource.addMethod("POST", uploadRamiMessageIntegration, {
            apiKeyRequired: true,
            methodResponses: [
                DigitrafficMethodResponse.response200(Model.EMPTY_MODEL),
                DigitrafficMethodResponse.response400()
            ]
        });

        return uploadLambda;
    }

    createUploadSmMessageResource(
        stack: DigitrafficStack,
        resource: Resource,
        sqs: Queue,
        dlq: Queue
    ): MonitoredDBFunction {
        const activeResource = resource.addResource("sm");
        const functionName = "RAMI-UploadRamiSmMessage";
        const uploadLambda = MonitoredFunction.create(stack, functionName, {
            functionName,
            timeout: Duration.seconds(15),
            memorySize: 256,
            code: new AssetCode("dist/lambda/upload-sm-message"),
            handler: "upload-sm-message.handler",
            runtime: Runtime.NODEJS_20_X,
            reservedConcurrentExecutions: 20,
            environment: { 
                [RamiEnvKeys.SM_SQS_URL]: sqs.queueUrl, 
                [RamiEnvKeys.DLQ_URL]: dlq.queueUrl 
            }
        });

        sqs.grantSendMessages(uploadLambda);
        dlq.grantSendMessages(uploadLambda);

        const uploadRamiMessageIntegration = new DigitrafficIntegration(uploadLambda).build();

        activeResource.addMethod("POST", uploadRamiMessageIntegration, {
            apiKeyRequired: true,
            methodResponses: [
                DigitrafficMethodResponse.response200(Model.EMPTY_MODEL),
                DigitrafficMethodResponse.response400()
            ]
        });

        return uploadLambda;
    }
}
