import { DigitrafficMethodResponse, MessageModel } from "@digitraffic/common/dist/aws/infra/api/response";
import { defaultIntegration } from "@digitraffic/common/dist/aws/infra/api/responses";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { createDefaultUsagePlan } from "@digitraffic/common/dist/aws/infra/usage-plans";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { addDefaultValidator } from "@digitraffic/common/dist/utils/api-model";
import apigateway, { EndpointType, LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import iam from "aws-cdk-lib/aws-iam";
import type { Open311Props } from "./app-props.js";

export function create(stack: DigitrafficStack, props: Open311Props): void {
    const integrationApi = createApi(stack);

    createRequestsResource(stack, integrationApi);
    createDefaultUsagePlan(integrationApi, "Integration", props.integrationApiKey);
}

function createApi(stack: DigitrafficStack): apigateway.RestApi {
    return new apigateway.RestApi(stack, "Open311-integration", {
        deployOptions: {
            loggingLevel: apigateway.MethodLoggingLevel.ERROR
        },
        restApiName: "Open311 integration API",
        endpointTypes: [EndpointType.REGIONAL],
        policy: new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ["execute-api:Invoke"],
                    resources: ["*"],
                    principals: [new iam.AnyPrincipal()]
                })
            ]
        })
    });
}

function createRequestsResource(stack: DigitrafficStack, integrationApi: apigateway.RestApi): void {
    const validator = addDefaultValidator(integrationApi);
    const apiResource = integrationApi.root.addResource("api");
    const v1Resource = apiResource.addResource("v1");
    const open311Resource = v1Resource.addResource("open311-integration");
    const requests = open311Resource.addResource("requests");
    const messageResponseModel = integrationApi.addModel("MessageResponseModel", MessageModel);

    createUpdateRequestHandler(requests, stack);
    createDeleteRequestHandler(requests, messageResponseModel, validator, stack);
}

function createUpdateRequestHandler(requests: apigateway.Resource, stack: DigitrafficStack): void {
    const updateRequestsId = "UpdateRequests";
    const updateRequestsHandler = MonitoredDBFunction.create(stack, updateRequestsId);
    requests.addMethod("POST", new LambdaIntegration(updateRequestsHandler), {
        apiKeyRequired: true
    });
}

function createDeleteRequestHandler(
    requests: apigateway.Resource,
    messageResponseModel: apigateway.Model,
    validator: apigateway.RequestValidator,
    stack: DigitrafficStack
): void {
    const deleteRequestId = "DeleteRequest";
    const deleteRequestHandler = MonitoredDBFunction.create(stack, deleteRequestId);
    // eslint-disable-next-line deprecation/deprecation
    const deleteRequestIntegration = defaultIntegration(deleteRequestHandler, {
        requestParameters: {
            "integration.request.path.request_id": "method.request.path.request_id",
            "integration.request.querystring.extensions": "method.request.querystring.extensions"
        },
        requestTemplates: {
            "application/json": JSON.stringify({
                request_id: "$util.escapeJavaScript($input.params('request_id'))",
                extensions: "$util.escapeJavaScript($input.params('extensions'))"
            })
        }
    });
    const request = requests.addResource("{request_id}");
    request.addMethod("DELETE", deleteRequestIntegration, {
        apiKeyRequired: true,
        requestValidator: validator,
        requestParameters: {
            "method.request.path.request_id": true,
            "method.request.querystring.extensions": false
        },
        methodResponses: [
            DigitrafficMethodResponse.response200(messageResponseModel, MediaType.APPLICATION_JSON),
            DigitrafficMethodResponse.response500(messageResponseModel, MediaType.APPLICATION_JSON)
        ]
    });
}
