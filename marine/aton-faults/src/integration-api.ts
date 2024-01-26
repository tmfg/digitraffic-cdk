import { type Model, PassthroughBehavior, type Resource } from "aws-cdk-lib/aws-apigateway";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import { createUsagePlan } from "@digitraffic/common/dist/aws/infra/usage-plans";
import { defaultIntegration } from "@digitraffic/common/dist/aws/infra/api/responses";
import { DigitrafficMethodResponse, MessageModel } from "@digitraffic/common/dist/aws/infra/api/response";
import { DocumentationPart } from "@digitraffic/common/dist/aws/infra/documentation";
import { AtonEnvKeys } from "./keys.js";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import {
    MonitoredDBFunction,
    type MonitoredFunction
} from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import type { Queue } from "aws-cdk-lib/aws-sqs";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";

export function create(stack: DigitrafficStack, s124Queue: Queue): void {
    const integrationApi = new DigitrafficRestApi(stack, "ATON-Integration", "ATON Faults integration API");

    // set response for missing auth token to 501 as desired by API registrar
    //setReturnCodeForMissingAuthenticationToken(501, 'Not implemented', integrationApi, stack);

    createUsagePlan(integrationApi, "ATON Faults CloudFront API Key", "ATON Faults CloudFront Usage Plan");
    const messageResponseModel = integrationApi.addModel("MessageResponseModel", MessageModel);
    createUploadVoyagePlanHandler(stack, messageResponseModel, s124Queue, integrationApi);
}

function createUploadVoyagePlanHandler(
    stack: DigitrafficStack,
    messageResponseModel: Model,
    s124Queue: Queue,
    integrationApi: DigitrafficRestApi
): void {
    const handler = createHandler(stack, s124Queue);

    const resource = integrationApi.root.addResource("s124").addResource("voyagePlans");
    createIntegrationResource(messageResponseModel, resource, handler);
    s124Queue.grantSendMessages(handler);

    integrationApi.documentResource(
        resource,
        DocumentationPart.method(
            ["API"],
            "ATON Faults",
            "Upload voyage plan in RTZ format in HTTP POST body. Active ATON faults relevant to the voyage plan are sent back in S-124 format if the query parameter callbackEndpoint is supplied."
        ),
        DocumentationPart.queryParameter("callbackEndpoint", "URL endpoint where S-124 ATON faults are sent")
    );
}

function createIntegrationResource(
    messageResponseModel: Model,
    resource: Resource,
    handler: MonitoredFunction
): void {
    const integration = defaultIntegration(handler, {
        passthroughBehavior: PassthroughBehavior.NEVER,
        disableCors: true,
        requestParameters: {
            "integration.request.querystring.callbackEndpoint": "method.request.querystring.callbackEndpoint"
        },
        requestTemplates: {
            // transformation from XML to JSON in API Gateway
            // some stuff needs to be quotes, other stuff does not, it's magic
            "text/xml": `{
                "callbackEndpoint": "$util.escapeJavaScript($input.params('callbackEndpoint'))",
                "voyagePlan": $input.json('$')
            }`
        }
    });
    resource.addMethod("POST", integration, {
        apiKeyRequired: true,
        requestParameters: {
            "method.request.querystring.callbackEndpoint": false
        },
        methodResponses: [
            DigitrafficMethodResponse.response200(messageResponseModel, MediaType.APPLICATION_JSON),
            DigitrafficMethodResponse.response400(messageResponseModel, MediaType.APPLICATION_JSON),
            DigitrafficMethodResponse.response500(messageResponseModel, MediaType.APPLICATION_JSON)
        ]
    });
}

function createHandler(stack: DigitrafficStack, s124Queue: Queue): MonitoredFunction {
    const environment = stack.createLambdaEnvironment();
    environment[AtonEnvKeys.SEND_S124_QUEUE_URL] = s124Queue.queueUrl;

    return MonitoredDBFunction.create(stack, "upload-voyage-plan", environment, {
        memorySize: 256
    });
}
