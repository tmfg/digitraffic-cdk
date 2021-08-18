import {Construct, Duration} from '@aws-cdk/core';
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {ISecurityGroup, IVpc} from "@aws-cdk/aws-ec2";
import {MobileServerProps} from "./app-props";
import {
    AwsIntegration,
    ContentHandling,
    EndpointType,
    IdentitySource,
    MethodLoggingLevel,
    Model,
    RequestAuthorizer,
    RestApi,
    ResponseType
} from '@aws-cdk/aws-apigateway';
import {UserPool, UserPoolClient} from "@aws-cdk/aws-cognito";
import {AssetCode, Function, Runtime} from '@aws-cdk/aws-lambda';
import {AnyPrincipal, Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal} from '@aws-cdk/aws-iam';
import {Bucket} from "@aws-cdk/aws-s3";

import {createUsagePlan} from "digitraffic-common/stack/usage-plans";
import {createResponses} from "digitraffic-common/api/response";
import {corsMethod, defaultIntegration, getResponse, methodResponse} from "digitraffic-common/api/responses";
import {MediaType} from "digitraffic-common/api/mediatypes";
import {addTagsAndSummary} from "digitraffic-common/api/documentation";
import {BETA_TAGS} from "digitraffic-common/api/tags";
import {dbLambdaConfiguration} from "digitraffic-common/stack/lambda-configs";
import {MarinecamEnvKeys} from "./keys";

export function create(
    secret: ISecret,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: MobileServerProps,
    bucket: Bucket,
    userPool: UserPool,
    userPoolClient: UserPoolClient,
    stack: Construct) {

    const marinecamApi = createApi(stack);

    marinecamApi.addGatewayResponse('authentication-failed', {
        type: ResponseType.UNAUTHORIZED,
        statusCode: "401",
        responseHeaders: {
            'WWW-Authenticate': "'Basic'"
        }
    });

    createUsagePlan(marinecamApi, 'Marinecam Api Key', 'Marinecam Usage Plan');

    const authorizer = createLambdaAuthorizer(stack, userPool, userPoolClient);
    const resources = createResourceTree(marinecamApi);

    createGetImageResource(resources, props, bucket, authorizer, stack);
    createListCamerasResource(resources, secret, vpc, lambdaDbSg, props, authorizer, stack);
}

function createResourceTree(marinecamApi: RestApi): any {
    const camerasResource = marinecamApi.root.addResource("cameras");
    const folderResource = camerasResource.addResource("{folderName}")
    const imageResource = folderResource.addResource("{imageName}");

    const metadataResource = camerasResource.addResource("metadata");

    return {
        camerasResource,
        imageResource,
        metadataResource
    }
}

function createListCamerasResource(resources: any, secret: ISecret, vpc: IVpc, lambdaDbSg: ISecurityGroup,
                                   props: MobileServerProps, authorizer: RequestAuthorizer, stack: Construct) {
    const listCamerasLambda = createListCamerasLambda(stack, vpc, lambdaDbSg, props);

    const listCamerasIntegration = defaultIntegration(listCamerasLambda, {
        requestTemplates: {
            'application/json': `{
                "groups": "$util.parseJson($context.authorizer.groups)"
            }`
        }
    });

    resources.metadataResource.addMethod("GET", listCamerasIntegration, {
        authorizer,
        apiKeyRequired: false,
        methodResponses: [
            corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, Model.EMPTY_MODEL)),
            corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, Model.ERROR_MODEL))
        ]
    });

    secret.grantRead(listCamerasLambda);

    addTagsAndSummary('List Cameras', BETA_TAGS, 'List all camera metadata', resources.metadataResource, stack);
}

function createGetImageResource(resources: any, props: MobileServerProps, bucket: Bucket, authorizer: RequestAuthorizer, stack: Construct) {
    const readImageRole = new Role(stack, "role", {
        assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
        path: "/service-role/"
    });

    const getImageIntegration = new AwsIntegration({
        service: 's3',
        path: bucket.bucketName + '/images/{folderName}/{objectName}',
        integrationHttpMethod: 'GET',
        options: {
            credentialsRole: readImageRole,
            requestParameters: {
                'integration.request.path.objectName': 'method.request.path.imageName',
                'integration.request.path.folderName': 'method.request.path.folderName'
            },
            integrationResponses: [
                getResponse({
                    statusCode: '200',
                    contentHandling: ContentHandling.CONVERT_TO_BINARY,
                    responseParameters: {
                        "method.response.header.Access-Control-Allow-Origin": "'*'",
                        "method.response.header.Timestamp": "'integration.response.header.Date'",
                        "method.response.header.Content-Length": "'integration.response.header.Content-Length'",
                        "method.response.header.Content-Type": "'integration.response.header.Content-Type'"
                    },
                }),
                getResponse({
                    statusCode: "404",
                    selectionPattern: '404',
                    responseTemplates: createResponses(MediaType.APPLICATION_JSON, 'not found')
                })
            ],

        }
    });

    bucket.grantRead(readImageRole);

    resources.imageResource.addMethod("GET", getImageIntegration, {
        authorizer,
        apiKeyRequired: false,
        requestParameters: {
            'method.request.path.imageName': true,
            'method.request.path.folderName': true
        },
        methodResponses: [
            methodResponse("200", MediaType.IMAGE_JPEG, Model.EMPTY_MODEL, {
                'method.response.header.Access-Control-Allow-Origin': true,
                'method.response.header.Timestamp': true,
                'method.response.header.Content-Type': true,
                'method.response.header.Content-Length': true

            }),
            methodResponse("404", MediaType.APPLICATION_JSON, Model.ERROR_MODEL, {
                'method.response.header.Access-Control-Allow-Origin': true
            })
        ]
    });

    addTagsAndSummary('GetImage', BETA_TAGS, 'Return image', resources.imageResource, stack);
}

function createListCamerasLambda(stack: Construct, vpc: IVpc, lambdaDbSg: ISecurityGroup, props: MobileServerProps): Function {
    const functionName = 'Marinecam-ListCameras';
    const environment = {} as any;
    environment[MarinecamEnvKeys.SECRET_ID] = props.secretId;

    return new Function(stack, functionName, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName,
        environment,
        timeout: 10,
        code: new AssetCode('dist/lambda/list-cameras'),
        handler: 'lambda-list-cameras.handler'
    }));
}

function createLambdaAuthorizer(stack: Construct, userPool: UserPool, userPoolClient: UserPoolClient): RequestAuthorizer {
    const functionName = 'Marinecam-Authorizer';
    const environment = {} as any;
    environment[MarinecamEnvKeys.USERPOOL_ID] = userPool.userPoolId;
    environment[MarinecamEnvKeys.POOLCLIENT_ID] = userPoolClient.userPoolClientId;

    const authFunction = new Function(stack, functionName, {
        functionName,
        environment,
        memorySize: 512,
        timeout: Duration.seconds(10),
        runtime: Runtime.NODEJS_12_X,
        code: new AssetCode('dist/lambda/authorizer'),
        handler: 'lambda-authorizer.handler'
    });

    return new RequestAuthorizer(stack, 'images-authorizer', {
        handler: authFunction,
        identitySources: [
            IdentitySource.header('Authorization')
        ]
    });
}

function createApi(stack: Construct): RestApi {
    return new RestApi(stack, 'Marinecam-restricted', {
        binaryMediaTypes: [
          MediaType.IMAGE_JPEG
        ],
        deployOptions: {
            loggingLevel: MethodLoggingLevel.ERROR,
        },
        restApiName: 'Marinecam restricted API',
        endpointTypes: [EndpointType.REGIONAL],
        policy: new PolicyDocument({
            statements: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: [
                        "execute-api:Invoke"
                    ],
                    resources: [
                        "*"
                    ],
                    principals: [
                        new AnyPrincipal()
                    ]
                })
            ]
        })
    });

}