import { DigitrafficIntegration } from "@digitraffic/common/dist/aws/infra/api/integration.js";
import { DigitrafficMethodResponse } from "@digitraffic/common/dist/aws/infra/api/response.js";
import {
    MonitoredDBFunction,
    MonitoredFunction
} from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction.js";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis.js";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack.js";
import { createDefaultUsagePlan } from "@digitraffic/common/dist/aws/infra/usage-plans.js";
import { Duration } from "aws-cdk-lib";
import { EndpointType, Model, type Resource } from "aws-cdk-lib/aws-apigateway";
import { AssetCode, Runtime } from "aws-cdk-lib/aws-lambda";
import type { Queue } from "aws-cdk-lib/aws-sqs";

export class IntegrationApi {
    readonly integrationApi: DigitrafficRestApi;
    readonly apiKeyId: string;

    constructor(stack: DigitrafficStack, sqs: Queue, dlq: Queue) {
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

        this.createUploadMessageResource(stack, resource, sqs, dlq);
    }

    createUploadMessageResource(
        stack: DigitrafficStack,
        resource: Resource,
        sqs: Queue,
        dlq: Queue
    ): MonitoredDBFunction {
        const activeResource = resource.addResource("message");
        const functionName = "RAMI-UploadRamiMessage";
        const uploadRamiMessageLambda = MonitoredFunction.create(stack, functionName, {
            functionName,
            timeout: Duration.seconds(15),
            memorySize: 256,
            code: new AssetCode("dist/lambda/upload-rami-message"),
            handler: "upload-rami-message.handler",
            runtime: Runtime.NODEJS_16_X,
            reservedConcurrentExecutions: 10,
            environment: { SQS_URL: sqs.queueUrl, DLQ_URL: dlq.queueUrl }
        });

        sqs.grantSendMessages(uploadRamiMessageLambda);
        dlq.grantSendMessages(uploadRamiMessageLambda);

        const uploadRamiMessageIntegration = new DigitrafficIntegration(uploadRamiMessageLambda).build();

        activeResource.addMethod("POST", uploadRamiMessageIntegration, {
            apiKeyRequired: true,
            methodResponses: [
                DigitrafficMethodResponse.response200(Model.EMPTY_MODEL),
                DigitrafficMethodResponse.response400()
            ]
        });

        return uploadRamiMessageLambda;
    }
}
