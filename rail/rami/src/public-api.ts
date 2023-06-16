import { DigitrafficIntegration } from "@digitraffic/common/dist/aws/infra/api/integration.js";
import { DigitrafficMethodResponse, MessageModel } from "@digitraffic/common/dist/aws/infra/api/response.js";
import { DocumentationPart } from "@digitraffic/common/dist/aws/infra/documentation.js";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction.js";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis.js";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack.js";
import { createDefaultUsagePlan } from "@digitraffic/common/dist/aws/infra/usage-plans.js";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes.js";
import {
    addDefaultValidator,
    addServiceModel,
    createArraySchema,
    getModelReference
} from "@digitraffic/common/dist/utils/api-model.js";
import { EndpointType, type IModel, type RequestValidator, type Resource } from "aws-cdk-lib/aws-apigateway";
import {
    TextSchema,
    createAudioSchema,
    createPassengerInformationMessageSchema,
    createVideoSchema
} from "./model/json-schema/passenger-information.js";
import type { ModelWithReference } from "@digitraffic/common/dist/aws/types/model-with-reference.js";

export class PublicApi {
    readonly publicApi: DigitrafficRestApi;
    readonly apiKeyId: string;

    constructor(stack: DigitrafficStack) {
        const apiName = "RAMI (passenger-information)";
        this.publicApi = new DigitrafficRestApi(stack, "RAMI-public", apiName, undefined, {
            endpointTypes: [EndpointType.PRIVATE]
        });

        this.apiKeyId = createDefaultUsagePlan(this.publicApi, apiName).keyId;
        const validator = addDefaultValidator(this.publicApi);

        const passengerInformationMessagesModel = this.createServiceModels(this.publicApi);
        const errorResponseModel = this.publicApi.addModel("MessageResponseModel", MessageModel);

        const resource = this.publicApi.root
            .addResource("api")
            .addResource("v1")
            .addResource("passenger-information");

        this.createActiveMessagesResource(
            stack,
            resource,
            passengerInformationMessagesModel,
            errorResponseModel,
            validator
        );
    }

    createActiveMessagesResource(
        stack: DigitrafficStack,
        resource: Resource,
        messageJsonModel: IModel,
        errorResponseModel: IModel,
        validator: RequestValidator
    ): MonitoredDBFunction {
        const activeResource = resource.addResource("active");
        const lambdaEnv = {
            ...(stack.configuration.secretId && { SECRET_ID: stack.configuration.secretId }),
            DB_APPLICATION: "avoindata"
        };
        const getActiveMessagesLambda = MonitoredDBFunction.create(stack, "get-active-messages", lambdaEnv, {
            timeout: 15,
            memorySize: 512,
            reservedConcurrentExecutions: 20,
            errorAlarmProps: {
                create: true,
                threshold: 3
            }
        });

        const getActiveMessageIntegration = new DigitrafficIntegration(
            getActiveMessagesLambda,
            MediaType.APPLICATION_JSON
        )
            .addQueryParameter("train_number", "train_departure_date", "station")
            .build();

        activeResource.addMethod("GET", getActiveMessageIntegration, {
            apiKeyRequired: true,
            requestParameters: {
                "method.request.querystring.station": false,
                "method.request.querystring.train_number": false,
                "method.request.querystring.train_departure_date": false
            },
            requestValidator: validator,
            methodResponses: [
                DigitrafficMethodResponse.response200(messageJsonModel, MediaType.APPLICATION_JSON),
                DigitrafficMethodResponse.response400(errorResponseModel)
            ]
        });

        this.publicApi.documentResource(
            activeResource,
            DocumentationPart.method(
                ["passenger-information"],
                "GetActiveMessages",
                "Get currently active passenger information messages"
            ),
            DocumentationPart.queryParameter("train_number", "Train number"),
            DocumentationPart.queryParameter(
                "train_departure_date",
                "Train departure date in format YYYY-MM-DD"
            ),
            DocumentationPart.queryParameter("station", `Station identifier, e.g. "HKI"`)
        );

        return getActiveMessagesLambda;
    }

    createServiceModels(api: DigitrafficRestApi): ModelWithReference {
        const textModel = addServiceModel("PassengerInformationTextContent", api, TextSchema);
        const audioModel = addServiceModel(
            "PassengerInformationAudio",
            this.publicApi,
            createAudioSchema(getModelReference(textModel.modelId, api.restApiId))
        );
        const videoModel = addServiceModel(
            "PassengerInformationVideo",
            this.publicApi,
            createVideoSchema(getModelReference(textModel.modelId, api.restApiId))
        );
        const messageModel = addServiceModel(
            "PassengerInformationMessage",
            this.publicApi,
            createPassengerInformationMessageSchema(
                getModelReference(audioModel.modelId, api.restApiId),
                getModelReference(videoModel.modelId, api.restApiId)
            )
        );
        return addServiceModel(
            "PassengerInformationMessages",
            this.publicApi,
            createArraySchema(messageModel, api)
        );
    }
}
