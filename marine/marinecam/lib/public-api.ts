import {Construct, Duration} from '@aws-cdk/core';
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {ISecurityGroup, IVpc} from "@aws-cdk/aws-ec2";
import {MobileServerProps} from "./app-props";
import {EndpointType, MethodLoggingLevel, RestApi, AwsIntegration, ContentHandling, RequestAuthorizer, IdentitySource, Model} from '@aws-cdk/aws-apigateway';
import {AssetCode, Function, Runtime} from '@aws-cdk/aws-lambda';
import {AnyPrincipal, Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal} from '@aws-cdk/aws-iam';
import {Bucket} from "@aws-cdk/aws-s3";

import {createUsagePlan} from "../../../common/stack/usage-plans";
import {createResponses, MessageModel} from "../../../common/api/response";
import {getResponse, methodResponse} from "../../../common/api/responses";
import {MediaType} from "../../../common/api/mediatypes";
import {addTagsAndSummary} from "../../../common/api/documentation";
import {BETA_TAGS} from "../../../common/api/tags";
import {KEY_POOLCLIENT_ID, KEY_USERPOOL_ID} from "./lambda/authorizer/cognito_keys";
import {UserPool, UserPoolClient} from "@aws-cdk/aws-cognito";

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

    createUsagePlan(marinecamApi, 'Marinecam Api Key', 'Marinecam Usage Plan');

    createGetImageResource(marinecamApi, props, bucket, userPool, userPoolClient, stack);
}

function createGetImageResource(marinecamApi: RestApi, props: MobileServerProps, bucket: Bucket, userPool: UserPool, userPoolClient: UserPoolClient, stack: Construct) {
    const readImageRole = new Role(stack, "role", {
        assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
        path: "/service-role/"
    });

    const errorResponseModel = marinecamApi.addModel('MessageResponseModel', MessageModel);

    const imagesResource = marinecamApi.root.addResource("images");
    const folderResource = imagesResource.addResource("{folderName}")
    const imageResource = folderResource.addResource("{imageName}");

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
                        "method.response.header.Timestamp": "integration.response.header.Date",
                        "method.response.header.Content-Length": "integration.response.header.Content-Length",
                        "method.response.header.Content-Type": "integration.response.header.Content-Type"
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

    const authorizer = createLambdaAuthorizer(stack, userPool, userPoolClient);

    imageResource.addMethod("GET", getImageIntegration, {
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
            methodResponse("404", MediaType.APPLICATION_JSON, errorResponseModel, {
                'method.response.header.Access-Control-Allow-Origin': true
            })
        ]
    });

    addTagsAndSummary('GetImage', BETA_TAGS, 'Return image', imageResource, stack);
}

function createLambdaAuthorizer(stack: Construct, userPool: UserPool, userPoolClient: UserPoolClient): RequestAuthorizer {
    const functionName = 'Marinecam-Authorizer';
    const environment = {} as any;
    environment[KEY_USERPOOL_ID] = userPool.userPoolId;
    environment[KEY_POOLCLIENT_ID] = userPoolClient.userPoolClientId;

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
            IdentitySource.queryString('username'),
            IdentitySource.queryString('password')
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