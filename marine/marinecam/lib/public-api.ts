import {
    AwsIntegration,
    ContentHandling,
    IdentitySource,
    Model,
    RequestAuthorizer,
    RestApi
} from '@aws-cdk/aws-apigateway';
import {UserPool, UserPoolClient} from "@aws-cdk/aws-cognito";
import {Role, ServicePrincipal} from '@aws-cdk/aws-iam';
import {Bucket} from "@aws-cdk/aws-s3";

import {createUsagePlan} from "digitraffic-common/stack/usage-plans";
import {createResponses} from "digitraffic-common/api/response";
import {corsMethod, defaultIntegration, getResponse, methodResponse} from "digitraffic-common/api/responses";
import {MediaType} from "digitraffic-common/api/mediatypes";
import {addTagsAndSummary} from "digitraffic-common/api/documentation";
import {BETA_TAGS} from "digitraffic-common/api/tags";
import {lambdaFunctionProps} from "digitraffic-common/stack/lambda-configs";
import {MarinecamEnvKeys} from "./keys";
import {LambdaEnvironment} from "digitraffic-common/model/lambda-environment";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {add401Support, DigitrafficRestApi} from "digitraffic-common/api/rest_apis";
import {MonitoredDBFunction, MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {DigitrafficLogSubscriptions} from "digitraffic-common/stack/subscription";

export function create(
    stack: DigitrafficStack,
    bucket: Bucket,
    userPool: UserPool,
    userPoolClient: UserPoolClient) {

    const marinecamApi = new DigitrafficRestApi(stack, 'Marinecam-restricted', 'Marinecam restricted API', undefined, {
        binaryMediaTypes: [
            MediaType.IMAGE_JPEG
        ]
    });

    add401Support(marinecamApi, stack);

    createUsagePlan(marinecamApi, 'Marinecam Api Key', 'Marinecam Usage Plan');

    const authorizer = createLambdaAuthorizer(stack, userPool, userPoolClient);
    const resources = createResourceTree(marinecamApi);

    createGetImageResource(stack, resources, bucket, authorizer);
    createListCamerasResource(stack, resources, authorizer);
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

function createListCamerasResource(stack: DigitrafficStack,
                                   resources: any,
                                   authorizer: RequestAuthorizer) {
    const listCamerasLambda = createListCamerasLambda(stack);

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

    addTagsAndSummary('List Cameras', BETA_TAGS, 'List all camera metadata', resources.metadataResource, stack);
}

function createGetImageResource(stack: DigitrafficStack,
                                resources: any,
                                bucket: Bucket,
                                authorizer: RequestAuthorizer) {
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

function createListCamerasLambda(stack: DigitrafficStack): MonitoredFunction {
    return MonitoredDBFunction.createV2(stack, 'list-cameras', undefined, {
        timeout: 10
    });
}

function createLambdaAuthorizer(stack: DigitrafficStack,
                                userPool: UserPool,
                                userPoolClient: UserPoolClient): RequestAuthorizer {
    const functionName = 'Marinecam-Authorizer';
    const environment: LambdaEnvironment = {};
    environment[MarinecamEnvKeys.USERPOOL_ID] = userPool.userPoolId;
    environment[MarinecamEnvKeys.POOLCLIENT_ID] = userPoolClient.userPoolClientId;

    const authFunction = MonitoredFunction.create(stack, functionName, lambdaFunctionProps(stack, environment, functionName, 'authorizer', {
        timeout: 10,
    }));

    return new RequestAuthorizer(stack, 'images-authorizer', {
        handler: authFunction,
        identitySources: [
            IdentitySource.header('Authorization')
        ]
    });
}
