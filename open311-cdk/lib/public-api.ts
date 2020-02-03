import apigateway = require('@aws-cdk/aws-apigateway');
import iam = require('@aws-cdk/aws-iam');
import * as lambda from '@aws-cdk/aws-lambda';
import * as ec2 from '@aws-cdk/aws-ec2';
import {EndpointType, LambdaIntegration, Model} from "@aws-cdk/aws-apigateway";
import {Construct} from "@aws-cdk/core";
import {dbLambdaConfiguration} from "./cdk-util";
import {default as ServiceSchema} from './model/service-schema';
import {default as RequestSchema} from './model/request-schema';
import {NOT_FOUND_MESSAGE} from 'digitraffic-cdk-api/errors';
import {
    InternalServerErrorResponseTemplate,
    MessageModel,
    NotFoundResponseTemplate
} from 'digitraffic-cdk-api/response';
import {getModelReference} from 'digitraffic-cdk-api/utils';

export function create(
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    stack: Construct,
    props: Props): string[] {

    const publicApi = createApi(stack, props);

    const validator = publicApi.addRequestValidator('DefaultValidator', {
        validateRequestParameters: true,
        validateRequestBody: true
    });

    const serviceModel = publicApi.addModel('ServiceModel', {
        contentType: 'application/json',
        modelName: 'ServiceModel',
        schema: ServiceSchema
    });
    const servicesModel = publicApi.addModel('ServicesModel', {
        contentType: 'application/json',
        modelName: 'ServicesModel',
        schema: {
            type: apigateway.JsonSchemaType.ARRAY,
            items: {
                ref: getModelReference(serviceModel.modelId, publicApi.restApiId)
            }
        }
    });
    const requestModel = publicApi.addModel('RequestModel', {
        contentType: 'application/json',
        modelName: 'RequestModel',
        schema: RequestSchema
    });
    const requestsModel = publicApi.addModel('RequestsModel', {
        contentType: 'application/json',
        modelName: 'RequestsModel',
        schema: {
            type: apigateway.JsonSchemaType.ARRAY,
            items: {
                ref: getModelReference(requestModel.modelId, publicApi.restApiId)
            }
        }
    });
    const messageResponseModel = publicApi.addModel('MessageResponseModel', MessageModel);

    const requestLambdaNames = createRequestsResource(publicApi,
        vpc,
        props,
        lambdaDbSg,
        requestModel,
        requestsModel,
        messageResponseModel,
        validator,
        stack);
    const serviceLambdaNames = createServicesResource(publicApi,
        vpc,
        props,
        lambdaDbSg,
        serviceModel,
        servicesModel,
        messageResponseModel,
        validator,
        stack);

    return requestLambdaNames.concat(serviceLambdaNames);
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
    stack: Construct): string[] {

    const requests = publicApi.root.addResource("requests");

    const getRequestsId = 'GetRequests';
    const getRequestsHandler = new lambda.Function(stack, getRequestsId, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: getRequestsId,
        code: new lambda.AssetCode('dist/lambda/get-requests'),
        handler: 'lambda-get-requests.handler'
    }));
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
    createGetRequestIntegration(getRequestsId,
        requests,
        getRequestHandler,
        requestModel,
        messageResponseModel,
        validator);

    return [getRequestsId, getRequestId];
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
            'integration.request.path.request_id': 'method.request.path.request_id'
        },
        requestTemplates: {
            'application/json': JSON.stringify({request_id: "$util.escapeJavaScript($input.params('request_id'))"})
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
            'method.request.path.request_id': true
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

function createServicesResource(
    publicApi: apigateway.RestApi,
    vpc: ec2.IVpc,
    props: Props,
    lambdaDbSg: ec2.ISecurityGroup,
    serviceModel: apigateway.Model,
    servicesModel: apigateway.Model,
    messageResponseModel: apigateway.Model,
    validator: apigateway.RequestValidator,
    stack: Construct): string[] {

    const services = publicApi.root.addResource("services");

    const getServicesId = 'GetServices';
    const getServicesHandler = new lambda.Function(stack, getServicesId, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: getServicesId,
        code: new lambda.AssetCode('dist/lambda/get-services'),
        handler: 'lambda-get-services.handler'
    }));
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
    createGetServiceIntegration(getServiceId,
        services,
        getServiceHandler,
        serviceModel,
        messageResponseModel,
        validator);

    return [getServicesId, getServiceId];
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
        endpointTypes: [EndpointType.PRIVATE],
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
                    conditions: {
                        "StringEquals": {
                            "aws:sourceVpc": props.vpcId
                        }
                    },
                    principals: [
                        new iam.AnyPrincipal()
                    ]
                })
            ]
        })
    });
}