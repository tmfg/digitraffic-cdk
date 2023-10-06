import {
    EndpointType,
    IModel,
    MethodLoggingLevel,
    MockIntegration,
    PassthroughBehavior,
    Resource,
    RestApi
} from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import {
    add404Support,
    createDefaultPolicyDocument
} from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import { createDefaultUsagePlan } from "@digitraffic/common/dist/aws/infra/usage-plans";
import { FormalityResponseJson } from "./model/formality";
import { databaseFunctionProps } from "@digitraffic/common/dist/aws/infra/stack/lambda-configs";
import { createSubscription } from "@digitraffic/common/dist/aws/infra/stack/subscription";
import {
    defaultIntegration,
    getResponse,
    RESPONSE_200_OK,
    RESPONSE_400_BAD_REQUEST,
    RESPONSE_500_SERVER_ERROR
} from "@digitraffic/common/dist/aws/infra/api/responses";
import { addServiceModel } from "@digitraffic/common/dist/utils/api-model";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { MessageModel, DigitrafficMethodResponse } from "@digitraffic/common/dist/aws/infra/api/response";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { EpcMessageSchema } from "./model/epcmessage_schema";

export function create(stack: DigitrafficStack, apikey: string): void {
    const api = createRestApi(stack, "GOFREP-Public", "GOFREP public API");

    const epcModel = addServiceModel("EPCModel", api, EpcMessageSchema);
    const messageModel = api.addModel("MessageResponseModel", MessageModel);
    const resource = api.root.addResource("mrs");
    createDefaultUsagePlan(api, "GOFREP / Integration", apikey);
    createMrsReportingFormalityResource(resource);
    createReceiveMrsReportResource(stack, resource, epcModel, messageModel);
}

function createRestApi(stack: Construct, apiId: string, apiName: string): RestApi {
    const restApi = new RestApi(stack, apiId, {
        deployOptions: {
            loggingLevel: MethodLoggingLevel.ERROR
        },
        restApiName: apiName,
        endpointTypes: [EndpointType.REGIONAL],
        policy: createDefaultPolicyDocument()
    });
    add404Support(restApi, stack);
    return restApi;
}

function createMrsReportingFormalityResource(resource: Resource): void {
    const integration = new MockIntegration({
        passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
        requestTemplates: {
            "application/json": `{
                "statusCode": 200
            }`
        },
        integrationResponses: [
            {
                statusCode: "200",
                responseTemplates: {
                    "application/json": JSON.stringify(FormalityResponseJson)
                }
            }
        ]
    });

    const metadataResource = resource.addResource("formality");

    metadataResource.addMethod("GET", integration, {
        apiKeyRequired: true,
        methodResponses: [
            {
                statusCode: "200"
            }
        ]
    });
}

function createReceiveMrsReportResource(
    stack: DigitrafficStack,
    resource: Resource,
    epcModel: IModel,
    messageModel: IModel
): void {
    const metadataResource = resource.addResource("report");
    const functionName = "GOFREP-ReceiveMRSReport";
    // ATTENTION!
    // This lambda needs to run in a VPC so that the outbound IP address is always the same (NAT Gateway).
    // The reason for this is IP based restriction in another system's firewall.
    const handler = MonitoredFunction.create(
        stack,
        functionName,
        databaseFunctionProps(stack, {}, functionName, "receive-epcmessage", {
            singleLambda: true,
            timeout: 10
        })
    );
    createSubscription(handler, functionName, stack.configuration.logsDestinationArn, stack);

    const integration = defaultIntegration(handler, {
        passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
        disableCors: true,
        responses: [
            getResponse(RESPONSE_200_OK, { disableCors: true }),
            getResponse(RESPONSE_400_BAD_REQUEST, { disableCors: true }),
            getResponse(RESPONSE_500_SERVER_ERROR, { disableCors: true })
        ]
    });
    metadataResource.addMethod("POST", integration, {
        apiKeyRequired: true,
        requestModels: {
            "application/json": epcModel
        },
        methodResponses: [
            DigitrafficMethodResponse.response200(epcModel, MediaType.APPLICATION_JSON),
            DigitrafficMethodResponse.response400(messageModel, MediaType.APPLICATION_JSON),
            DigitrafficMethodResponse.response500(messageModel, MediaType.APPLICATION_JSON)
        ]
    });
}
