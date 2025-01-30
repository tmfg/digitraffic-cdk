import apigateway = require("aws-cdk-lib/aws-apigateway");
import { EndpointType } from "aws-cdk-lib/aws-apigateway";
import type * as lambda from "aws-cdk-lib/aws-lambda";

import {
  DigitrafficMethodResponse,
  MessageModel,
} from "@digitraffic/common/dist/aws/infra/api/response";
import { defaultIntegration } from "@digitraffic/common/dist/aws/infra/api/responses";
import { addTags } from "@digitraffic/common/dist/aws/infra/documentation";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { createIpRestrictionPolicyDocument } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { createDefaultUsagePlan } from "@digitraffic/common/dist/aws/infra/usage-plans";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { DATA_V1_TAGS } from "@digitraffic/common/dist/aws/types/tags";
import {
  addDefaultValidator,
  addServiceModel,
  createArraySchema,
} from "@digitraffic/common/dist/utils/api-model";

import type { Open311Props } from "./app-props.js";
import { default as RequestSchema } from "./model/request-schema.js";
import { default as ServiceSchema } from "./model/service-schema.js";
import { default as StateSchema } from "./model/state-schema.js";
import { default as SubjectSchema } from "./model/subject-schema.js";
import { default as SubSubjectSchema } from "./model/subsubject-schema.js";

export function create(stack: DigitrafficStack, props: Open311Props): void {
  const publicApi = createApi(stack, props.allowFromIpAddresses);

  createDefaultUsagePlan(publicApi, "Open311 CloudFront", props.publicApiKey);

  const validator = addDefaultValidator(publicApi);

  const requestModel = addServiceModel(
    "RequestModel",
    publicApi,
    RequestSchema,
  );
  const requestsModel = addServiceModel(
    "RequestsModel",
    publicApi,
    createArraySchema(requestModel, publicApi),
  );
  const stateModel = addServiceModel("StateModel", publicApi, StateSchema);
  const subjectModel = addServiceModel(
    "SubjectModel",
    publicApi,
    SubjectSchema,
  );
  const subSubjectModel = addServiceModel(
    "SubSubjectModel",
    publicApi,
    SubSubjectSchema,
  );
  const serviceModel = addServiceModel(
    "ServiceModel",
    publicApi,
    ServiceSchema,
  );
  const servicesModel = addServiceModel(
    "ServicesModel",
    publicApi,
    createArraySchema(serviceModel, publicApi),
  );
  const messageResponseModel = publicApi.addModel(
    "MessageResponseModel",
    MessageModel,
  );

  const apiResource = publicApi.root.addResource("api");
  const v1Resource = apiResource.addResource("v1");
  const open311Resource = v1Resource.addResource("open311");

  createRequestsResource(
    open311Resource,
    requestModel,
    requestsModel,
    messageResponseModel,
    validator,
    stack,
  );
  createStatesResource(
    open311Resource,
    stateModel,
    messageResponseModel,
    stack,
  );
  createSubjectsResource(
    open311Resource,
    subjectModel,
    messageResponseModel,
    stack,
  );
  createSubSubjectsResource(
    open311Resource,
    subSubjectModel,
    messageResponseModel,
    stack,
  );
  createServicesResource(
    open311Resource,
    serviceModel,
    servicesModel,
    messageResponseModel,
    validator,
    stack,
  );
}

function createRequestsResource(
  open311Resource: apigateway.Resource,
  requestModel: apigateway.Model,
  requestsModel: apigateway.Model,
  messageResponseModel: apigateway.Model,
  validator: apigateway.RequestValidator,
  stack: DigitrafficStack,
): void {
  const requests = open311Resource.addResource("requests");

  const getRequestsId = "Open311-GetRequests";
  const getRequestsHandler = MonitoredDBFunction.create(stack, getRequestsId);
  createGetRequestsIntegration(
    requests,
    getRequestsHandler,
    requestsModel,
    messageResponseModel,
    stack,
  );

  const getRequestId = "Open311-GetRequest";
  const getRequestHandler = MonitoredDBFunction.create(stack, getRequestId);
  createGetRequestIntegration(
    requests,
    getRequestHandler,
    requestModel,
    messageResponseModel,
    validator,
    stack,
  );
}

function createGetRequestIntegration(
  requests: apigateway.Resource,
  getRequestHandler: lambda.Function,
  requestModel: apigateway.Model,
  messageResponseModel: apigateway.Model,
  validator: apigateway.RequestValidator,
  stack: DigitrafficStack,
): void {
  // eslint-disable-next-line deprecation/deprecation
  const getRequestIntegration = defaultIntegration(getRequestHandler, {
    requestParameters: {
      "integration.request.path.request_id": "method.request.path.request_id",
      "integration.request.querystring.extensions":
        "method.request.querystring.extensions",
    },
    requestTemplates: {
      "application/json": JSON.stringify({
        request_id: "$util.escapeJavaScript($input.params('request_id'))",
        extensions: "$util.escapeJavaScript($input.params('extensions'))",
      }),
    },
  });
  const request = requests.addResource("{request_id}");
  request.addMethod("GET", getRequestIntegration, {
    apiKeyRequired: true,
    requestValidator: validator,
    requestParameters: {
      "method.request.path.request_id": true,
      "method.request.querystring.extensions": false,
    },
    methodResponses: [
      DigitrafficMethodResponse.response200(
        requestModel,
        MediaType.APPLICATION_JSON,
      ),
      DigitrafficMethodResponse.response(
        "404",
        messageResponseModel,
        MediaType.APPLICATION_JSON,
      ),
      DigitrafficMethodResponse.response500(
        messageResponseModel,
        MediaType.APPLICATION_JSON,
      ),
    ],
  });
  addTags("GetRequest", DATA_V1_TAGS, request, stack);
}

function createGetRequestsIntegration(
  requests: apigateway.Resource,
  getRequestsHandler: lambda.Function,
  requestsModel: apigateway.Model,
  messageResponseModel: apigateway.Model,
  stack: DigitrafficStack,
): void {
  // eslint-disable-next-line deprecation/deprecation
  const getRequestsIntegration = defaultIntegration(getRequestsHandler, {
    requestParameters: {
      "integration.request.querystring.extensions":
        "method.request.querystring.extensions",
    },
    requestTemplates: {
      "application/json": JSON.stringify({
        extensions: "$util.escapeJavaScript($input.params('extensions'))",
      }),
    },
  });
  requests.addMethod("GET", getRequestsIntegration, {
    apiKeyRequired: true,
    requestParameters: {
      "method.request.querystring.extensions": false,
    },
    methodResponses: [
      DigitrafficMethodResponse.response200(
        requestsModel,
        MediaType.APPLICATION_JSON,
      ),
      DigitrafficMethodResponse.response500(
        messageResponseModel,
        MediaType.APPLICATION_JSON,
      ),
    ],
  });
  addTags("GetRequests", DATA_V1_TAGS, requests, stack);
}

function createStatesResource(
  open311Resource: apigateway.Resource,
  stateModel: apigateway.Model,
  messageResponseModel: apigateway.Model,
  stack: DigitrafficStack,
): void {
  const states = open311Resource.addResource("states");

  const getStatesId = "Open311-GetStates";
  const getStatesHandler = MonitoredDBFunction.create(stack, getStatesId);
  createGetLocalizedResourceIntegration(
    "GetStates",
    states,
    getStatesHandler,
    stateModel,
    messageResponseModel,
    stack,
  );
}

function createSubjectsResource(
  open311Resource: apigateway.Resource,
  subjectModel: apigateway.Model,
  messageResponseModel: apigateway.Model,
  stack: DigitrafficStack,
): void {
  const subjects = open311Resource.addResource("subjects");
  const getSubjectsId = "Open311-GetSubjects";
  const getSubjectsHandler = MonitoredDBFunction.create(stack, getSubjectsId);
  createGetLocalizedResourceIntegration(
    "GetSubjects",
    subjects,
    getSubjectsHandler,
    subjectModel,
    messageResponseModel,
    stack,
  );
}

function createSubSubjectsResource(
  open311Resource: apigateway.Resource,
  subSubjectModel: apigateway.Model,
  messageResponseModel: apigateway.Model,
  stack: DigitrafficStack,
): void {
  const subSubjects = open311Resource.addResource("subsubjects");
  const getSubSubjectsId = "Open311-GetSubSubjects";
  const getSubSubjectsHandler = MonitoredDBFunction.create(
    stack,
    getSubSubjectsId,
  );
  createGetLocalizedResourceIntegration(
    "GetSubSubjects",
    subSubjects,
    getSubSubjectsHandler,
    subSubjectModel,
    messageResponseModel,
    stack,
  );
}

function createServicesResource(
  open311Resource: apigateway.Resource,
  serviceModel: apigateway.Model,
  servicesModel: apigateway.Model,
  messageResponseModel: apigateway.Model,
  validator: apigateway.RequestValidator,
  stack: DigitrafficStack,
): void {
  const services = open311Resource.addResource("services");

  const getServicesId = "Open311-GetServices";
  const getServicesHandler = MonitoredDBFunction.create(stack, getServicesId);
  createGetResourcesIntegration(
    services,
    getServicesHandler,
    servicesModel,
    messageResponseModel,
    "GetServices",
    stack,
  );

  const getServiceId = "Open311-GetService";
  const getServiceHandler = MonitoredDBFunction.create(stack, getServiceId);
  createGetServiceIntegration(
    services,
    getServiceHandler,
    serviceModel,
    messageResponseModel,
    validator,
    stack,
  );
}

function createGetResourcesIntegration(
  resource: apigateway.Resource,
  handler: lambda.Function,
  model: apigateway.Model,
  messageResponseModel: apigateway.Model,
  tag: string,
  stack: DigitrafficStack,
): void {
  // eslint-disable-next-line deprecation/deprecation
  const integration = defaultIntegration(handler);
  resource.addMethod("GET", integration, {
    apiKeyRequired: true,
    methodResponses: [
      DigitrafficMethodResponse.response200(model, MediaType.APPLICATION_JSON),
      DigitrafficMethodResponse.response500(
        messageResponseModel,
        MediaType.APPLICATION_JSON,
      ),
    ],
  });
  addTags(tag, DATA_V1_TAGS, resource, stack);
}

function createGetLocalizedResourceIntegration(
  id: string,
  resource: apigateway.Resource,
  handler: lambda.Function,
  model: apigateway.Model,
  messageResponseModel: apigateway.Model,
  stack: DigitrafficStack,
): void {
  // eslint-disable-next-line deprecation/deprecation
  const integration = defaultIntegration(handler, {
    requestParameters: {
      "integration.request.querystring.locale":
        "method.request.querystring.locale",
    },
    requestTemplates: {
      "application/json": JSON.stringify({
        locale: "$util.escapeJavaScript($input.params('locale'))",
      }),
    },
  });
  resource.addMethod("GET", integration, {
    apiKeyRequired: true,
    requestParameters: {
      "method.request.querystring.locale": false,
    },
    methodResponses: [
      DigitrafficMethodResponse.response200(model, MediaType.APPLICATION_JSON),
      DigitrafficMethodResponse.response500(
        messageResponseModel,
        MediaType.APPLICATION_JSON,
      ),
    ],
  });
  addTags(id, DATA_V1_TAGS, resource, stack);
}

function createGetServiceIntegration(
  services: apigateway.Resource,
  getServiceHandler: lambda.Function,
  serviceModel: apigateway.Model,
  messageResponseModel: apigateway.Model,
  validator: apigateway.RequestValidator,
  stack: DigitrafficStack,
): void {
  // eslint-disable-next-line deprecation/deprecation
  const getServiceIntegration = defaultIntegration(getServiceHandler, {
    requestParameters: {
      "integration.request.path.service_id": "method.request.path.service_id",
    },
    requestTemplates: {
      "application/json": JSON.stringify({
        service_id: "$util.escapeJavaScript($input.params('service_id'))",
      }),
    },
  });
  const service = services.addResource("{service_id}");
  service.addMethod("GET", getServiceIntegration, {
    apiKeyRequired: true,
    requestValidator: validator,
    requestParameters: {
      "method.request.path.service_id": true,
    },
    methodResponses: [
      DigitrafficMethodResponse.response200(
        serviceModel,
        MediaType.APPLICATION_JSON,
      ),
      DigitrafficMethodResponse.response(
        "404",
        messageResponseModel,
        MediaType.APPLICATION_JSON,
      ),
      DigitrafficMethodResponse.response500(
        messageResponseModel,
        MediaType.APPLICATION_JSON,
      ),
    ],
  });
  addTags("GetService", DATA_V1_TAGS, service, stack);
}

function createApi(
  stack: DigitrafficStack,
  allowFromIpAddresses: string[],
): apigateway.RestApi {
  return new apigateway.RestApi(stack, "Open311-public", {
    defaultCorsPreflightOptions: {
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
    },
    endpointExportName: "Open311publicEndpoint",
    deployOptions: {
      loggingLevel: apigateway.MethodLoggingLevel.ERROR,
    },
    restApiName: "Open311 public API",
    endpointTypes: [EndpointType.REGIONAL],
    policy: createIpRestrictionPolicyDocument(allowFromIpAddresses),
  });
}
