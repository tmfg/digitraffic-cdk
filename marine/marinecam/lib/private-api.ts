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
import {MobileServerProps} from "./app-props";
import {Construct} from "constructs";

export class PrivateApi {
    private readonly stack: DigitrafficStack;
    private readonly bucket: Bucket;
    public readonly restApi;

    // authorizer protected
    private imageResource: Resource;
    private metadataResource: Resource;

    // api key protected Saimaa-images
    private ibnetImageResource: Resource;
    private ibnetMetadataResource: Resource;
    private apiImageResource: Resource;
    private apiMetadataResource: Resource;

    constructor(stack: DigitrafficStack, bucket: Bucket) {
        this.stack = stack;
        this.bucket = bucket;

        this.restApi = new DigitrafficRestApi(
            stack, 'Marinecam-restricted', 'Marinecam restricted API', undefined, {
                binaryMediaTypes: [
                    MediaType.IMAGE_JPEG,
                ],
            },
        );
        this.restApi.createUsagePlan('Marinecam Api Key', 'Marinecam Usage Plan');
        this.restApi.createUsagePlan('Marinecam Api Key 2', 'Marinecam Usage Plan 2');

        const readImageRole = this.createReadImageRole();

        add401Support(this.restApi, stack);

        this.createResourceTree(stack);

        if ((stack.configuration as MobileServerProps).enablePasswordProtectedApi) {
            const [userPool, userPoolClient] = this.createUserPool(stack);

            this.createPasswordProtectedResources(readImageRole, userPool, userPoolClient);
        }

        if ((stack.configuration as MobileServerProps).enableKeyProtectedApi) {
            this.createApikeyProtectedResources(readImageRole);
        }
    }

    createUserPool(stack: Construct): [UserPool, UserPoolClient] {
        const userPool = new UserPool(stack, 'UserPool', {
            userPoolName: 'MarinecamUserPool',
        });

        const userPoolClient = new UserPoolClient(stack, 'UserPoolClient', {
            userPool,
            authFlows: {
                userPassword: true,
                userSrp: true,
            },
            disableOAuth: true,
        });

        return [userPool, userPoolClient];
    }

    createPasswordProtectedResources(readImageRole: Role,
        userPool: UserPool,
        userPoolClient: UserPoolClient) {
        const authorizer = this.createLambdaAuthorizer(userPool, userPoolClient);

        this.createGetImageResource(authorizer, readImageRole);
        this.createListCamerasResource(authorizer);
    }

    createApikeyProtectedResources(readImageRole: Role) {
        this.createImageResource(readImageRole, this.ibnetImageResource, this.apiImageResource);
        this.createMetadataResource(this.ibnetMetadataResource, this.apiMetadataResource);
    }

    createResourceTree(stack: DigitrafficStack) {
        // old authorizer protected resources
        if ((stack.configuration as MobileServerProps).enablePasswordProtectedApi) {
            const camerasResource = this.restApi.root.addResource("cameras");
            const folderResource = camerasResource.addResource("{folderName}");
            this.imageResource = folderResource.addResource("{imageName}");
            this.metadataResource = camerasResource.addResource("metadata");
        }

        // new api-key protected resources
        if ((stack.configuration as MobileServerProps).enableKeyProtectedApi) {
            const apiResource = this.restApi.root.addResource("api");
            const marinecamResource = apiResource.addResource("marinecam");
            const ibnetResource = marinecamResource.addResource("ibnet");
            const marinecamCamerasResource = marinecamResource.addResource("cameras");

            this.ibnetImageResource = ibnetResource.addResource("{imageName}");
            this.ibnetMetadataResource = ibnetResource.addResource("metadata");
            this.apiImageResource = marinecamCamerasResource.addResource("{imageName}");
            this.apiMetadataResource = marinecamCamerasResource.addResource("metadata");
        }
    }

    createMetadataResource(...resources: Resource[]) {
        const metadataLambda = MonitoredDBFunction.create(this.stack, 'get-metadata');

        const metadataIntegration = defaultIntegration(metadataLambda, {
            responses: [
                DigitrafficIntegrationResponse.ok(MediaType.APPLICATION_JSON),
                DigitrafficIntegrationResponse.badRequest(),
            ],
        });

        resources.forEach(resource => resource.addMethod("GET", metadataIntegration, {
            apiKeyRequired: true,
            methodResponses: [
                corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, Model.EMPTY_MODEL)),
                corsMethod(methodResponse("403", MediaType.TEXT_PLAIN, Model.ERROR_MODEL)),
                corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, Model.ERROR_MODEL)),
            ],
        }));
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

    createImageResource(readImageRole: Role, ...resources: Resource[]) {
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

        resources.forEach(resource => resource.addMethod("GET", getImageIntegration, {
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
        }));
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
