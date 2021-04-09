import {Construct} from '@aws-cdk/core';
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {ISecurityGroup, IVpc} from "@aws-cdk/aws-ec2";
import {MobileServerProps} from "./app-props";
import {EndpointType, MethodLoggingLevel, RestApi, AwsIntegration, ContentHandling} from '@aws-cdk/aws-apigateway';
import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {AnyPrincipal, Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal} from '@aws-cdk/aws-iam';

import {createUsagePlan} from "../../../common/stack/usage-plans";
import {createResponses, MessageModel} from "../../../common/api/response";
import {defaultLambdaConfiguration} from "../../../common/stack/lambda-configs";
import {
    corsMethod,
    getResponse,
    methodResponse,
    RESPONSE_200_OK
} from "../../../common/api/responses";
import {MediaType} from "../../../common/api/mediatypes";
import {addSimpleServiceModel} from "../../../common/api/utils";
import {addTagsAndSummary} from "../../../common/api/documentation";
import {BETA_TAGS} from "../../../common/api/tags";
import {Bucket} from "@aws-cdk/aws-s3";

export function create(
    secret: ISecret,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: MobileServerProps,
    bucket: Bucket,
    stack: Construct) {

    const marinecamApi = createApi(stack);

    createUsagePlan(marinecamApi, 'Marinecam Api Key', 'Marinecam Usage Plan');

    createGetImageResource(marinecamApi, props, bucket, stack);
}

function createGetImageResource(marinecamApi: RestApi, props: MobileServerProps, bucket: Bucket, stack: Construct) {
    const readImageRole = new Role(stack, "role", {
        assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
        path: "/service-role/"
    });

    const errorResponseModel = marinecamApi.addModel('MessageResponseModel', MessageModel);
    const jpegModel = addSimpleServiceModel('JpegModel', marinecamApi, MediaType.IMAGE_JPEG);

    const imagesResource = marinecamApi.root.addResource("images");
    const folderResource = imagesResource.addResource("{folderName}")
    const imageResource = folderResource.addResource("{imageName}");

    const getImageIntegration = new AwsIntegration({
        service: 's3',
        path: bucket.bucketName + '/images/{folderName}/{objectName}',
        integrationHttpMethod: 'GET',
        options: {
            credentialsRole: readImageRole,
            contentHandling: ContentHandling.CONVERT_TO_BINARY,
            requestParameters: {
                'integration.request.path.objectName': 'method.request.path.imageName',
                'integration.request.path.folderName': 'method.request.path.folderName'
            },
            integrationResponses: [
                getResponse({
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Timestamp': 'integration.response.header.Date',
                        'method.response.header.Content-Length': 'integration.response.header.Content-Length',
                        'method.response.header.Content-Type': 'integration.response.header.Content-Type'
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

    imageResource.addMethod("GET", getImageIntegration, {
        apiKeyRequired: false,
        requestParameters: {
            'method.request.path.imageName': true,
            'method.request.path.folderName': true
        },
        methodResponses: [
            methodResponse("200", MediaType.IMAGE_JPEG, jpegModel, {
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

function createGetImageLambda(stack: Construct): Function {
    const functionName = 'Marinecam-GetImage';
    const assetCode = new AssetCode('dist/lambda/');
    const environment: any = {};

    return new Function(stack, functionName, defaultLambdaConfiguration({
        environment,
        functionName: functionName,
        code: assetCode,
        handler: 'lambda-get-image.handler',
        readOnly: true
    }));
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