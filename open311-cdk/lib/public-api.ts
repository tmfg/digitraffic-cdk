import apigateway = require('@aws-cdk/aws-apigateway');
import iam = require('@aws-cdk/aws-iam');
import * as lambda from '@aws-cdk/aws-lambda';
import * as ec2 from '@aws-cdk/aws-ec2';
import {EndpointType, LambdaIntegration} from "@aws-cdk/aws-apigateway";
import {Construct} from "@aws-cdk/core";
import {dbLambdaConfiguration} from "./cdk-util";
import {default as ServiceSchema} from './model/service-schema';
import {default as RequestSchema} from './model/request-schema';
import {default as StateSchema} from './model/state-schema';
import {NOT_FOUND_MESSAGE} from 'digitraffic-cdk-api/errors';
import {
    InternalServerErrorResponseTemplate,
    MessageModel,
    NotFoundResponseTemplate
} from 'digitraffic-cdk-api/response';
import {addDefaultValidator, addServiceModel, createArraySchema} from 'digitraffic-cdk-api/utils';
import {createSubscription} from "../../common/stack/subscription";
import {createUsagePlan} from "../../common/stack/usage-plans";

export function create(
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    stack: Construct,
    props: Props) {

    const publicApi = createApi(stack, props);

    createUsagePlan(publicApi, 'Open311 CloudFront API Key', 'Open311 CloudFront Usage Plan');

    const validator = addDefaultValidator(publicApi);

    const requestModel = addServiceModel('RequestModel', publicApi, RequestSchema);
    const requestsModel = addServiceModel('RequestsModel', publicApi, createArraySchema(requestModel, publicApi));
    const stateModel = addServiceModel('StateModel', publicApi, StateSchema);
    const serviceModel = addServiceModel('ServiceModel', publicApi, ServiceSchema);
    const servicesModel = addServiceModel('ServicesModel', publicApi, createArraySchema(serviceModel, publicApi));
    const messageResponseModel = publicApi.addModel('MessageResponseModel', MessageModel);

    createRequestsResource(publicApi,
        vpc,
        props,
        lambdaDbSg,
        requestModel,
        requestsModel,
        messageResponseModel,
        validator,
        stack);
    createStatesResource(publicApi,
        vpc,
        props,
        lambdaDbSg,
        stateModel,
        messageResponseModel,
        validator,
        stack);
    createServicesResource(publicApi,
        vpc,
        props,
        lambdaDbSg,
        serviceModel,
        servicesModel,
        messageResponseModel,
        validator,
        stack);
}

function createRequestsResource(
    publicApi: apigateway.RestApi,
    vpc: ec2.IVpc,
    props: Props,
    lambdaDbSg: ec2.ISecurityGroup,
    requestModel: apigateway.Model,
    requestsModel: apigateway.Model,
    messageResponseModel: apigateway.Model,
    validator: apigateway.RequestValidator,
    stack: Construct) {

    const apiResource = publicApi.root.addResource("api");
    const v1Resource = apiResource.addResource("v1");
    const open311Resource = v1Resource.addResource("open311");
    const requests = open311Resource.addResource("requests");

    const getRequestsId = 'GetRequests';
    const getRequestsHandler = new lambda.Function(stack, getRequestsId, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: getRequestsId,
        code: new lambda.AssetCode('dist/lambda/get-requests'),
        handler: 'lambda-get-requests.handler'
    }));
    createSubscription(getRequestsHandler, getRequestsId, props.logsDestinationArn, stack);
    createGetRequestsIntegration(getRequestsId,
        requests,
        getRequestsHandler,
        requestsModel,
        messageResponseModel);

    const getRequestId = 'GetRequest';
    const getRequestHandler = new lambda.Function(stack, getRequestId, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: getRequestId,
        code: new lambda.AssetCode('dist/lambda/get-request'),
        handler: 'lambda-get-request.handler'
    }));
    createSubscription(getRequestHandler, getRequestId, props.logsDestinationArn, stack);
    createGetRequestIntegration(getRequestsId,
        requests,
        getRequestHandler,
        requestModel,
        messageResponseModel,
        validator);
}

function createGetRequestIntegration(
    getRequestsId: string,
    requests: apigateway.Resource,
    getRequestHandler: lambda.Function,
    requestModel: apigateway.Model,
    messageResponseModel: apigateway.Model,
    validator: apigateway.RequestValidator) {

    const getRequestIntegration = new LambdaIntegration(getRequestHandler, {
        proxy: false,
        requestParameters: {
            'integration.request.path.request_id': 'method.request.path.request_id',
            'integration.request.querystring.extensions': 'method.request.querystring.extensions'
        },
        requestTemplates: {
            'application/json': JSON.stringify({
                request_id: "$util.escapeJavaScript($input.params('request_id'))",
                extensions: "$util.escapeJavaScript($input.params('extensions'))"
            })
        },
        integrationResponses: [
            {
                statusCode: '200'
            },
            {
                statusCode: '404',
                selectionPattern: NOT_FOUND_MESSAGE,
                responseTemplates: NotFoundResponseTemplate
            },
            {
                statusCode: '500',
                selectionPattern: '(\n|.)+',
                responseTemplates: InternalServerErrorResponseTemplate
            }
        ]
    });
    const request = requests.addResource("{request_id}");
    request.addMethod("GET", getRequestIntegration, {
        requestValidator: validator,
        requestParameters: {
            'method.request.path.request_id': true,
            'method.request.querystring.extensions': false
        },
        methodResponses: [
            {
                statusCode: '200',
                responseModels: {
                    'application/json': requestModel
                }
            },
            {
                statusCode: '404',
                responseModels: {
                    'application/json': messageResponseModel
                }
            },
            {
                statusCode: '500',
                responseModels: {
                    'application/json': messageResponseModel
                }
            }
        ]
    });
}

function createGetRequestsIntegration(
    getRequestsId: string,
    requests: apigateway.Resource,
    getRequestsHandler: lambda.Function,
    requestsModel: apigateway.Model,
    messageResponseModel: apigateway.Model) {

    const getRequestsIntegration = new LambdaIntegration(getRequestsHandler, {
        proxy: false,
        requestParameters: {
            'integration.request.querystring.extensions': 'method.request.querystring.extensions'
        },
        requestTemplates: {
            'application/json': JSON.stringify({
                extensions: "$util.escapeJavaScript($input.params('extensions'))"
            })
        },
        integrationResponses: [
            {
                statusCode: '200'
            },
            {
                statusCode: '500',
                responseTemplates: InternalServerErrorResponseTemplate
            }
        ]
    });
    requests.addMethod("GET", getRequestsIntegration, {
        requestParameters: {
            'method.request.querystring.extensions': false
        },
        methodResponses: [
            {
                statusCode: '200',
                responseModels: {
                    'application/json': requestsModel
                }
            },
            {
                statusCode: '500',
                responseModels: {
                    'application/json': messageResponseModel
                }
            }
        ]
    });
}

function createStatesResource(
    publicApi: apigateway.RestApi,
    vpc: ec2.IVpc,
    props: Props,
    lambdaDbSg: ec2.ISecurityGroup,
    stateModel: apigateway.Model,
    messageResponseModel: apigateway.Model,
    validator: apigateway.RequestValidator,
    stack: Construct) {

    const states = publicApi.root.addResource("states");

    const getStatesId = 'GetStates';
    const getStatesHandler = new lambda.Function(stack, getStatesId, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: getStatesId,
        code: new lambda.AssetCode('dist/lambda/get-states'),
        handler: 'lambda-get-states.handler'
    }));
    createSubscription(getStatesHandler, getStatesId, props.logsDestinationArn, stack);
    createGetStatesIntegration(states,
        getStatesHandler,
        stateModel,
        messageResponseModel);
}

function createGetStatesIntegration(
    states: apigateway.Resource,
    getStatesHandler: lambda.Function,
    statesModel: apigateway.Model,
    messageResponseModel: apigateway.Model) {

    const getServicesIntegration = new LambdaIntegration(getStatesHandler, {
        proxy: false,
        integrationResponses: [
            {
                statusCode: '200'
            },
            {
                statusCode: '500',
                responseTemplates: InternalServerErrorResponseTemplate
            }
        ]
    });
    states.addMethod("GET", getServicesIntegration, {
        methodResponses: [
            {
                statusCode: '200',
                responseModels: {
                    'application/json': statesModel
                }
            },
            {
                statusCode: '500',
                responseModels: {
                    'application/json': messageResponseModel
                }
            }
        ]
    });
}

function createServicesResource(
    publicApi: apigateway.RestApi,
    vpc: ec2.IVpc,
    props: Props,
    lambdaDbSg: ec2.ISecurityGroup,
    serviceModel: apigateway.Model,
    servicesModel: apigateway.Model,
    messageResponseModel: apigateway.Model,
    validator: apigateway.RequestValidator,
    stack: Construct) {

    const apiResource = publicApi.root.addResource("api");
    const v1Resource = apiResource.addResource("v1");
    const open311Resource = v1Resource.addResource("open311");
    const services = open311Resource.addResource("services");

    const getServicesId = 'GetServices';
    const getServicesHandler = new lambda.Function(stack, getServicesId, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: getServicesId,
        code: new lambda.AssetCode('dist/lambda/get-services'),
        handler: 'lambda-get-services.handler'
    }));
    createSubscription(getServicesHandler, getServicesId, props.logsDestinationArn, stack);
    createGetServicesIntegration(getServicesId,
        services,
        getServicesHandler,
        servicesModel,
        messageResponseModel);

    const getServiceId = 'GetService';
    const getServiceHandler = new lambda.Function(stack, getServiceId, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: getServiceId,
        code: new lambda.AssetCode('dist/lambda/get-service'),
        handler: 'lambda-get-service.handler'
    }));
    createSubscription(getServiceHandler, getServiceId, props.logsDestinationArn, stack);
    createGetServiceIntegration(getServiceId,
        services,
        getServiceHandler,
        serviceModel,
        messageResponseModel,
        validator);
}

function createGetServicesIntegration(
    getServicesId: string,
    services: apigateway.Resource,
    getServicesHandler: lambda.Function,
    servicesModel: apigateway.Model,
    messageResponseModel: apigateway.Model) {

    const getServicesIntegration = new LambdaIntegration(getServicesHandler, {
        proxy: false,
        integrationResponses: [
            {
                statusCode: '200'
            },
            {
                statusCode: '500',
                responseTemplates: InternalServerErrorResponseTemplate
            }
        ]
    });
    services.addMethod("GET", getServicesIntegration, {
        methodResponses: [
            {
                statusCode: '200',
                responseModels: {
                    'application/json': servicesModel
                }
            },
            {
                statusCode: '500',
                responseModels: {
                    'application/json': messageResponseModel
                }
            }
        ]
    });
}

function createGetServiceIntegration(
    getServiceId: string,
    services: apigateway.Resource,
    getServiceHandler: lambda.Function,
    serviceModel: apigateway.Model,
    messageResponseModel: apigateway.Model,
    validator: apigateway.RequestValidator) {
    const getServiceIntegration = new LambdaIntegration(getServiceHandler, {
        proxy: false,
        requestParameters: {
            'integration.request.path.service_id': 'method.request.path.service_id'
        },
        requestTemplates: {
            'application/json': JSON.stringify({service_id: "$util.escapeJavaScript($input.params('service_id'))"})
        },
        integrationResponses: [
            {
                statusCode: '200'
            },
            {
                statusCode: '404',
                selectionPattern: NOT_FOUND_MESSAGE,
                responseTemplates: NotFoundResponseTemplate
            },
            {
                statusCode: '500',
                selectionPattern: '(\n|.)+',
                responseTemplates: InternalServerErrorResponseTemplate
            }
        ]
    });
    const service = services.addResource("{service_id}");
    service.addMethod("GET", getServiceIntegration, {
        requestValidator: validator,
        requestParameters: {
            'method.request.path.service_id': true
        },
        methodResponses: [
            {
                statusCode: '200',
                responseModels: {
                    'application/json': serviceModel
                }
            },
            {
                statusCode: '404',
                responseModels: {
                    'application/json': messageResponseModel
                }
            },
            {
                statusCode: '500',
                responseModels: {
                    'application/json': messageResponseModel
                }
            }
        ]
    });
}

function createApi(stack: Construct, props: Props) {
    return new apigateway.RestApi(stack, 'Open311-public', {
        deployOptions: {
            loggingLevel: apigateway.MethodLoggingLevel.ERROR,
        },
        restApiName: 'Open311 public API',
        endpointTypes: [EndpointType.REGIONAL],
        policy: new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        "execute-api:Invoke"
                    ],
                    resources: [
                        "*"
                    ],
                    principals: [
                        new iam.AnyPrincipal()
                    ]
                })
            ]
        })
    });
}