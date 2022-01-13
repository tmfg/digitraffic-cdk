import {
    AwsIntegration,
    ContentHandling,
    IdentitySource,
    Model,
    RequestAuthorizer,
    Resource,
} from 'aws-cdk-lib/aws-apigateway';
import {UserPool, UserPoolClient} from "aws-cdk-lib/aws-cognito";
import {Role, ServicePrincipal} from 'aws-cdk-lib/aws-iam';
import {Bucket} from "aws-cdk-lib/aws-s3";
import {createResponses} from "digitraffic-common/aws/infra/api/response";
import {corsMethod, defaultIntegration, getResponse, methodResponse} from "digitraffic-common/aws/infra/api/responses";
import {MediaType} from "digitraffic-common/aws/types/mediatypes";
import {addTagsAndSummary} from "digitraffic-common/aws/infra/documentation";
import {BETA_TAGS} from "digitraffic-common/aws/types/tags";
import {LambdaEnvironment, lambdaFunctionProps} from "digitraffic-common/aws/infra/stack/lambda-configs";
import {MarinecamEnvKeys} from "./keys";
import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {add401Support, DigitrafficRestApi} from "digitraffic-common/aws/infra/stack/rest_apis";
import {MonitoredDBFunction, MonitoredFunction} from "digitraffic-common/aws/infra/stack/monitoredfunction";
import {DigitrafficIntegrationResponse} from "digitraffic-common/aws/runtime/digitraffic-integration-response";

export class PrivateApi {
    private readonly stack: DigitrafficStack;
    private readonly bucket: Bucket;
    public readonly publicApi;

    // authorizer protected
    private imageResource: Resource;
    private metadataResource: Resource;

    // api key protected Saimaa-images
    private apiImageResource: Resource;
    private apiMetadataResource: Resource;

    constructor(stack: DigitrafficStack, bucket: Bucket, userPool: UserPool, userPoolClient: UserPoolClient) {
        this.stack = stack;
        this.bucket = bucket;

        this.publicApi = new DigitrafficRestApi(
            stack, 'Marinecam-restricted', 'Marinecam restricted API', undefined, {
                binaryMediaTypes: [
                    MediaType.IMAGE_JPEG,
                ],
            },
        );
        this.publicApi.createUsagePlan('Marinecam Api Key', 'Marinecam Usage Plan');

        const readImageRole = this.createReadImageRole();

        add401Support(this.publicApi, stack);

        this.createResourceTree();
        this.createPasswordProtectedResources(readImageRole, userPool, userPoolClient);
        this.createApikeyProtectedResources(readImageRole);
    }

    createPasswordProtectedResources(readImageRole: Role,
        userPool: UserPool,
        userPoolClient: UserPoolClient) {
        const authorizer = this.createLambdaAuthorizer(userPool, userPoolClient);

        this.createGetImageResource(authorizer, readImageRole);
        this.createListCamerasResource(authorizer);
    }

    createApikeyProtectedResources(readImageRole: Role) {
        this.createImageResource(readImageRole);
        this.createMetadataResource();
    }

    createResourceTree() {
        // old authorizer protected resources
        const camerasResource = this.publicApi.root.addResource("cameras");
        const folderResource = camerasResource.addResource("{folderName}");
        this.imageResource = folderResource.addResource("{imageName}");
        this.metadataResource = camerasResource.addResource("metadata");

        // new api-key protected resources
        const apiResource = this.publicApi.root.addResource("api");
        const marinecamResource = apiResource.addResource("marinecam");
        const ibnetResource = marinecamResource.addResource("ibnet");
        this.apiImageResource = ibnetResource.addResource("{imageName}");
        this.apiMetadataResource = ibnetResource.addResource("metadata");
    }

    createMetadataResource() {
        const metadataLambda = MonitoredDBFunction.create(this.stack, 'get-metadata');

        const metadataIntegration = defaultIntegration(metadataLambda, {
            responses: [
                DigitrafficIntegrationResponse.ok(MediaType.APPLICATION_JSON),
                DigitrafficIntegrationResponse.badRequest(),
            ],
        });

        this.apiMetadataResource.addMethod("GET", metadataIntegration, {
            apiKeyRequired: true,
            methodResponses: [
                corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, Model.EMPTY_MODEL)),
                corsMethod(methodResponse("403", MediaType.TEXT_PLAIN, Model.ERROR_MODEL)),
                corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, Model.ERROR_MODEL)),
            ],
        });
    }

    createListCamerasResource(authorizer: RequestAuthorizer) {
        const listCamerasLambda = MonitoredDBFunction.create(this.stack, 'list-cameras');

        const listCamerasIntegration = defaultIntegration(listCamerasLambda, {
            requestTemplates: {
                'application/json': `{
                "groups": "$util.parseJson($context.authorizer.groups)"
            }`,
            },
        });

        this.metadataResource.addMethod("GET", listCamerasIntegration, {
            authorizer,
            apiKeyRequired: false,
            methodResponses: [
                corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, Model.EMPTY_MODEL)),
                corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, Model.ERROR_MODEL)),
            ],
        });

        addTagsAndSummary(
            'List Cameras', BETA_TAGS, 'List all camera metadata', this.metadataResource, this.stack,
        );
    }

    createReadImageRole(): Role {
        const readImageRole = new Role(this.stack, "role", {
            assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
            path: "/service-role/",
        });

        this.bucket.grantRead(readImageRole);

        return readImageRole;
    }

    createImageResource(readImageRole: Role) {
        const getImageIntegration = new AwsIntegration({
            service: 's3',
            path: this.bucket.bucketName + '/images/Saimaa/{objectName}',
            integrationHttpMethod: 'GET',
            options: {
                credentialsRole: readImageRole,
                requestParameters: {
                    'integration.request.path.objectName': 'method.request.path.imageName',
                },
                integrationResponses: [
                    getResponse({
                        statusCode: '200',
                        contentHandling: ContentHandling.CONVERT_TO_BINARY,
                        responseParameters: {
                            "method.response.header.Access-Control-Allow-Origin": "'*'",
                            "method.response.header.Timestamp": "'integration.response.header.Date'",
                            "method.response.header.Content-Length": "'integration.response.header.Content-Length'",
                            "method.response.header.Content-Type": "'integration.response.header.Content-Type'",
                        },
                    }),
                    getResponse({
                        statusCode: "404",
                        selectionPattern: '404',
                        responseTemplates: createResponses(MediaType.APPLICATION_JSON, 'not found'),
                    }),
                ],
            },
        });

        this.apiImageResource.addMethod("GET", getImageIntegration, {
            apiKeyRequired: true,
            requestParameters: {
                'method.request.path.imageName': true,
            },
            methodResponses: [
                methodResponse("200", MediaType.IMAGE_JPEG, Model.EMPTY_MODEL, {
                    'method.response.header.Access-Control-Allow-Origin': true,
                    'method.response.header.Timestamp': true,
                    'method.response.header.Content-Type': true,
                    'method.response.header.Content-Length': true,
                }),
                corsMethod(methodResponse("403", MediaType.TEXT_PLAIN, Model.ERROR_MODEL)),
                corsMethod(methodResponse("404", MediaType.APPLICATION_JSON, Model.ERROR_MODEL)),
            ],
        });
    }

    createGetImageResource(authorizer: RequestAuthorizer, readImageRole: Role) {
        const getImageIntegration = new AwsIntegration({
            service: 's3',
            path: this.bucket.bucketName + '/images/{folderName}/{objectName}',
            integrationHttpMethod: 'GET',
            options: {
                credentialsRole: readImageRole,
                requestParameters: {
                    'integration.request.path.objectName': 'method.request.path.imageName',
                    'integration.request.path.folderName': 'method.request.path.folderName',
                },
                integrationResponses: [
                    getResponse({
                        statusCode: '200',
                        contentHandling: ContentHandling.CONVERT_TO_BINARY,
                        responseParameters: {
                            "method.response.header.Access-Control-Allow-Origin": "'*'",
                            "method.response.header.Timestamp": "'integration.response.header.Date'",
                            "method.response.header.Content-Length": "'integration.response.header.Content-Length'",
                            "method.response.header.Content-Type": "'integration.response.header.Content-Type'",
                        },
                    }),
                    getResponse({
                        statusCode: "404",
                        selectionPattern: '404',
                        responseTemplates: createResponses(MediaType.APPLICATION_JSON, 'not found'),
                    }),
                ],
            },
        });
        this.imageResource.addMethod("GET", getImageIntegration, {
            authorizer,
            apiKeyRequired: false,
            requestParameters: {
                'method.request.path.imageName': true,
                'method.request.path.folderName': true,
            },
            methodResponses: [
                methodResponse("200", MediaType.IMAGE_JPEG, Model.EMPTY_MODEL, {
                    'method.response.header.Access-Control-Allow-Origin': true,
                    'method.response.header.Timestamp': true,
                    'method.response.header.Content-Type': true,
                    'method.response.header.Content-Length': true,

                }),
                methodResponse("404", MediaType.APPLICATION_JSON, Model.ERROR_MODEL, {
                    'method.response.header.Access-Control-Allow-Origin': true,
                }),
            ],
        });

        addTagsAndSummary(
            'GetImage', BETA_TAGS, 'Return image', this.imageResource, this.stack,
        );
    }

    createLambdaAuthorizer(userPool: UserPool,
        userPoolClient: UserPoolClient)
        : RequestAuthorizer {
        const functionName = 'Marinecam-Authorizer';
        const environment: LambdaEnvironment = {
            [MarinecamEnvKeys.USERPOOL_ID]: userPool.userPoolId,
            [MarinecamEnvKeys.POOLCLIENT_ID]: userPoolClient.userPoolClientId,
        };

        const authFunction = MonitoredFunction.create(this.stack, functionName, lambdaFunctionProps(
            this.stack, environment, functionName, 'authorizer', {
                timeout: 10,
            },
        ));

        return new RequestAuthorizer(this.stack, 'images-authorizer', {
            handler: authFunction,
            identitySources: [
                IdentitySource.header('Authorization'),
            ],
        });
    }
}
