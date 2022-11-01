import {
    Model,
    PassthroughBehavior,
    Resource,
    RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import { createUsagePlan } from "@digitraffic/common/dist/aws/infra/usage-plans";
import {
    defaultIntegration,
    methodResponse,
} from "@digitraffic/common/dist/aws/infra/api/responses";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { MessageModel } from "@digitraffic/common/dist/aws/infra/api/response";
import {
    addQueryParameterDescription,
    addTagsAndSummary,
} from "@digitraffic/common/dist/aws/infra/documentation";
import { AtonEnvKeys } from "./keys";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import {
    MonitoredDBFunction,
    MonitoredFunction,
} from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { Queue } from "aws-cdk-lib/aws-sqs";

export function create(stack: DigitrafficStack, s124Queue: Queue) {
    const integrationApi = new DigitrafficRestApi(
        stack,
        "ATON-Integration",
        "ATON Faults integration API"
    );

    // set response for missing auth token to 501 as desired by API registrar
    //setReturnCodeForMissingAuthenticationToken(501, 'Not implemented', integrationApi, stack);

    createUsagePlan(
        integrationApi,
        "ATON Faults CloudFront API Key",
        "ATON Faults CloudFront Usage Plan"
    );
    const messageResponseModel = integrationApi.addModel(
        "MessageResponseModel",
        MessageModel
    );
    createUploadVoyagePlanHandler(
        stack,
        messageResponseModel,
        s124Queue,
        integrationApi
    );
}

function createUploadVoyagePlanHandler(
    stack: DigitrafficStack,
    messageResponseModel: Model,
    s124Queue: Queue,
    integrationApi: RestApi
) {
    const handler = createHandler(stack, s124Queue);

    const resource = integrationApi.root
        .addResource("s124")
        .addResource("voyagePlans");
    createIntegrationResource(stack, messageResponseModel, resource, handler);
    s124Queue.grantSendMessages(handler);
}

function createIntegrationResource(
    stack: Construct,
    messageResponseModel: Model,
    resource: Resource,
    handler: MonitoredFunction
) {
    const integration = defaultIntegration(handler, {
        passthroughBehavior: PassthroughBehavior.NEVER,
        disableCors: true,
        requestParameters: {
            "integration.request.querystring.callbackEndpoint":
                "method.request.querystring.callbackEndpoint",
        },
        requestTemplates: {
            // transformation from XML to JSON in API Gateway
            // some stuff needs to be quotes, other stuff does not, it's magic
            "text/xml": `{
                "callbackEndpoint": "$util.escapeJavaScript($input.params('callbackEndpoint'))",
                "voyagePlan": $input.json('$')
            }`,
        },
    });
    resource.addMethod("POST", integration, {
        apiKeyRequired: true,
        requestParameters: {
            "method.request.querystring.callbackEndpoint": false,
        },
        methodResponses: [
            methodResponse(
                "200",
                MediaType.APPLICATION_JSON,
                messageResponseModel
            ),
            methodResponse(
                "400",
                MediaType.APPLICATION_JSON,
                messageResponseModel
            ),
            methodResponse(
                "500",
                MediaType.APPLICATION_JSON,
                messageResponseModel
            ),
        ],
    });
    addQueryParameterDescription(
        "callbackEndpoint",
        "URL endpoint where S-124 ATON faults are sent",
        resource,
        stack
    );
    addTagsAndSummary(
        "ATON Faults",
        ["API"],
        "Upload voyage plan in RTZ format in HTTP POST body. Active ATON faults relevant to the voyage plan are sent back in S-124 format if the query parameter callbackEndpoint is supplied.",
        resource,
        stack
    );
}

function createHandler(
    stack: DigitrafficStack,
    s124Queue: Queue
): MonitoredFunction {
    const environment = stack.createLambdaEnvironment();
    environment[AtonEnvKeys.SEND_S124_QUEUE_URL] = s124Queue.queueUrl;

    return MonitoredDBFunction.create(
        stack,
        "upload-voyage-plan",
        environment,
        {
            memorySize: 256,
        }
    );
}
