import { DigitrafficIntegration } from "@digitraffic/common/dist/aws/infra/api/integration";
import {
  DigitrafficMethodResponse,
  MessageModel,
} from "@digitraffic/common/dist/aws/infra/api/response";
import { DocumentationPart } from "@digitraffic/common/dist/aws/infra/documentation";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { createDefaultUsagePlan } from "@digitraffic/common/dist/aws/infra/usage-plans";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import type { ModelWithReference } from "@digitraffic/common/dist/aws/types/model-with-reference";
import {
  addDefaultValidator,
  addServiceModel,
  createArraySchema,
  getModelReference,
} from "@digitraffic/common/dist/utils/api-model";
import {
  EndpointType,
  type IModel,
  type RequestValidator,
  type Resource,
} from "aws-cdk-lib/aws-apigateway";
import {
  createAudioSchema,
  createPassengerInformationMessageSchema,
  createVideoSchema,
  TextSchema,
} from "./model/json-schema/passenger-information.js";

export class PublicApi {
  readonly publicApi: DigitrafficRestApi;
  readonly apiKeyId: string;

  constructor(stack: DigitrafficStack) {
    const apiName = "RAMI (passenger information) public API";
    this.publicApi = new DigitrafficRestApi(
      stack,
      "RAMI-public",
      apiName,
      undefined,
      {
        endpointTypes: [EndpointType.PRIVATE],
      },
    );

    this.apiKeyId = createDefaultUsagePlan(this.publicApi, apiName).keyId;
    this.publicApi.apiKeyIds.push(this.apiKeyId);
    const validator = addDefaultValidator(this.publicApi);

    const passengerInformationMessagesModel = this.createServiceModels(
      this.publicApi,
    );
    const errorResponseModel = this.publicApi.addModel(
      "MessageResponseModel",
      MessageModel,
    );

    const resource = this.publicApi.root
      .addResource("api")
      .addResource("v1")
      .addResource("passenger-information");

    this.createActiveMessagesResource(
      stack,
      resource,
      passengerInformationMessagesModel,
      errorResponseModel,
      validator,
    );

    this.createMessagesUpdatedAfterResource(
      stack,
      resource,
      passengerInformationMessagesModel,
      errorResponseModel,
      validator,
    );
  }

  createActiveMessagesResource(
    stack: DigitrafficStack,
    resource: Resource,
    messageJsonModel: IModel,
    errorResponseModel: IModel,
    validator: RequestValidator,
  ): MonitoredDBFunction {
    const activeResource = resource.addResource("active");
    const lambdaEnv = {
      ...(stack.configuration.secretId &&
        { SECRET_ID: stack.configuration.secretId }),
      DB_APPLICATION: "avoindata",
    };
    const getActiveMessagesLambda = MonitoredDBFunction.create(
      stack,
      "get-active-messages",
      lambdaEnv,
      {
        timeout: 15,
        memorySize: 512,
        reservedConcurrentExecutions: 20,
        errorAlarmProps: {
          create: true,
          threshold: 3,
        },
      },
    );

    const getActiveMessageIntegration = new DigitrafficIntegration(
      getActiveMessagesLambda,
      MediaType.APPLICATION_JSON,
    )
      .addQueryParameter(
        "train_number",
        "train_departure_date",
        "station",
        "only_general",
      )
      .build();

    activeResource.addMethod("GET", getActiveMessageIntegration, {
      apiKeyRequired: true,
      requestParameters: {
        "method.request.querystring.station": false,
        "method.request.querystring.train_number": false,
        "method.request.querystring.train_departure_date": false,
        "method.request.querystring.only_general": false,
      },
      requestValidator: validator,
      methodResponses: [
        DigitrafficMethodResponse.response200(
          messageJsonModel,
          MediaType.APPLICATION_JSON,
        ),
        DigitrafficMethodResponse.response400(errorResponseModel),
      ],
    });

    this.publicApi.addCorsOptions(activeResource);

    this.publicApi.documentResource(
      activeResource,
      DocumentationPart.method(
        ["passenger-information"],
        "GetActiveMessages",
        "Get currently active passenger information messages",
      ),
      DocumentationPart.queryParameter("train_number", "Train number"),
      DocumentationPart.queryParameter(
        "train_departure_date",
        "Train departure date in format YYYY-MM-DD",
      ),
      DocumentationPart.queryParameter(
        "station",
        `Station identifier, for example _HKI_`,
      ),
      DocumentationPart.queryParameter(
        "only_general",
        "If _true_, return only general notices (notices not related to a train number). _false_ by default",
      ),
    );

    return getActiveMessagesLambda;
  }

  createMessagesUpdatedAfterResource(
    stack: DigitrafficStack,
    resource: Resource,
    messageJsonModel: IModel,
    errorResponseModel: IModel,
    validator: RequestValidator,
  ): MonitoredDBFunction {
    const updatedAfterResource = resource.addResource("updated-after")
      .addResource("{date}");
    const lambdaEnv = {
      ...(stack.configuration.secretId &&
        { SECRET_ID: stack.configuration.secretId }),
      DB_APPLICATION: "avoindata",
    };
    const getMessagesUpdatedAfterLambda = MonitoredDBFunction.create(
      stack,
      "get-messages-updated-after",
      lambdaEnv,
      {
        timeout: 15,
        memorySize: 512,
        reservedConcurrentExecutions: 20,
        errorAlarmProps: {
          create: true,
          threshold: 3,
        },
      },
    );

    const getMessagesUpdatedAfterIntegration = new DigitrafficIntegration(
      getMessagesUpdatedAfterLambda,
      MediaType.APPLICATION_JSON,
    )
      .addPathParameter("date")
      .addQueryParameter(
        "train_number",
        "train_departure_date",
        "station",
        "only_general",
        "only_active",
      )
      .build();

    updatedAfterResource.addMethod("GET", getMessagesUpdatedAfterIntegration, {
      apiKeyRequired: true,
      requestParameters: {
        "method.request.path.date": true,
        "method.request.querystring.station": false,
        "method.request.querystring.train_number": false,
        "method.request.querystring.train_departure_date": false,
        "method.request.querystring.only_general": false,
        "method.request.querystring.only_active": false,
      },
      requestValidator: validator,
      methodResponses: [
        DigitrafficMethodResponse.response200(
          messageJsonModel,
          MediaType.APPLICATION_JSON,
        ),
        DigitrafficMethodResponse.response400(errorResponseModel),
      ],
    });

    this.publicApi.addCorsOptions(updatedAfterResource);

    this.publicApi.documentResource(
      updatedAfterResource,
      DocumentationPart.method(
        ["passenger-information"],
        "GetMessagesUpdatedAfter",
        "Get messages updated after date",
      ),
      DocumentationPart.pathParameter(
        "date",
        "Date or date-time on or after which message was created or updated. For example _2023-01-01_ or _2023-01-01T12:00Z_",
      ),
      DocumentationPart.queryParameter("train_number", "Train number"),
      DocumentationPart.queryParameter(
        "train_departure_date",
        "Train departure date in format YYYY-MM-DD",
      ),
      DocumentationPart.queryParameter(
        "station",
        `Station identifier, for example _HKI_`,
      ),
      DocumentationPart.queryParameter(
        "only_general",
        "If _true_, return only general notices (notices not related to a train number). _false_ by default",
      ),
      DocumentationPart.queryParameter(
        "only_active",
        "If _true_, return only currently active messages. _false_ returns all messages updated after _{date}_ regardless of validity dates. _true_ by default",
      ),
    );

    return getMessagesUpdatedAfterLambda;
  }

  createServiceModels(api: DigitrafficRestApi): ModelWithReference {
    const textModel = addServiceModel(
      "PassengerInformationTextContent",
      api,
      TextSchema,
    );
    const audioModel = addServiceModel(
      "PassengerInformationAudio",
      this.publicApi,
      createAudioSchema(getModelReference(textModel.modelId, api.restApiId)),
    );
    const videoModel = addServiceModel(
      "PassengerInformationVideo",
      this.publicApi,
      createVideoSchema(getModelReference(textModel.modelId, api.restApiId)),
    );
    const messageModel = addServiceModel(
      "PassengerInformationMessage",
      this.publicApi,
      createPassengerInformationMessageSchema(
        getModelReference(audioModel.modelId, api.restApiId),
        getModelReference(videoModel.modelId, api.restApiId),
      ),
    );
    return addServiceModel(
      "PassengerInformationMessages",
      this.publicApi,
      createArraySchema(messageModel, api),
    );
  }
}
