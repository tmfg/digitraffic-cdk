import {
    AwsIntegration,
    ContentHandling,
    IdentitySource,
    Model,
    RequestAuthorizer,
    type Resource
} from "aws-cdk-lib/aws-apigateway";
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import type { Bucket } from "aws-cdk-lib/aws-s3";
import { DigitrafficIntegration } from "@digitraffic/common/dist/aws/infra/api/integration";
import { getResponse, methodResponse } from "@digitraffic/common/dist/aws/infra/api/responses";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { BETA_TAGS } from "@digitraffic/common/dist/aws/types/tags";
import {
    type LambdaEnvironment,
    lambdaFunctionProps
} from "@digitraffic/common/dist/aws/infra/stack/lambda-configs";
import { MarinecamEnvKeys } from "./keys.js";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { add401Support, DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import {
    MonitoredDBFunction,
    MonitoredFunction
} from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { DigitrafficMethodResponse } from "@digitraffic/common/dist/aws/infra/api/response";
import { DocumentationPart } from "@digitraffic/common/dist/aws/infra/documentation";
import type { MobileServerProps } from "./app-props.js";
import type { Construct } from "constructs";

export class PrivateApi {
    private readonly stack: DigitrafficStack;
    private readonly bucket: Bucket;
    public readonly restApi: DigitrafficRestApi;

    // authorizer protected
    private imageResource!: Resource;
    private metadataResource!: Resource;

    // api key protected Saimaa-images
    private ibnetImageResource!: Resource;
    private ibnetMetadataResource!: Resource;
    private apiImageResource!: Resource;
    private apiMetadataResource!: Resource;

    constructor(stack: DigitrafficStack, bucket: Bucket) {
        this.stack = stack;
        this.bucket = bucket;

        this.restApi = new DigitrafficRestApi(
            stack,
            "Marinecam-restricted",
            "Marinecam restricted API",
            undefined,
            {
                binaryMediaTypes: [MediaType.IMAGE_JPEG]
            }
        );
        this.restApi.createUsagePlan("Marinecam Api Key", "Marinecam Usage Plan");
        this.restApi.createUsagePlan("Marinecam Api Key 2", "Marinecam Usage Plan 2");

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
        const userPool = new UserPool(stack, "UserPool", {
            userPoolName: "MarinecamUserPool"
        });

        const userPoolClient = new UserPoolClient(stack, "UserPoolClient", {
            userPool,
            authFlows: {
                userPassword: true,
                userSrp: true
            },
            disableOAuth: true
        });

        return [userPool, userPoolClient];
    }

    createPasswordProtectedResources(
        readImageRole: Role,
        userPool: UserPool,
        userPoolClient: UserPoolClient
    ): void {
        const authorizer = this.createLambdaAuthorizer(userPool, userPoolClient);

        this.createGetImageResource(authorizer, readImageRole);
        this.createListCamerasResource(authorizer);
    }

    createApikeyProtectedResources(readImageRole: Role): void {
        this.createImageResource(readImageRole, this.ibnetImageResource, this.apiImageResource);
        this.createMetadataResource(this.ibnetMetadataResource, this.apiMetadataResource);
    }

    createResourceTree(stack: DigitrafficStack): void {
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

    createMetadataResource(...resources: Resource[]): void {
        const metadataLambda = MonitoredDBFunction.create(this.stack, "get-metadata");

        const metadataIntegration = new DigitrafficIntegration(
            metadataLambda,
            MediaType.APPLICATION_JSON
        ).build();

        resources.forEach((resource) =>
            resource.addMethod("GET", metadataIntegration, {
                apiKeyRequired: true,
                methodResponses: [
                    DigitrafficMethodResponse.response200(Model.EMPTY_MODEL, MediaType.APPLICATION_JSON),
                    DigitrafficMethodResponse.response("403", Model.ERROR_MODEL, MediaType.TEXT_PLAIN),
                    DigitrafficMethodResponse.response500(Model.ERROR_MODEL, MediaType.APPLICATION_JSON)
                ]
            })
        );
    }

    createListCamerasResource(authorizer: RequestAuthorizer): void {
        const listCamerasLambda = MonitoredDBFunction.create(this.stack, "list-cameras");

        const listCamerasIntegration = new DigitrafficIntegration(
            listCamerasLambda,
            MediaType.APPLICATION_JSON
        )
            .addContextParameter("authorizer.groups")
            .build();

        this.metadataResource.addMethod("GET", listCamerasIntegration, {
            authorizer,
            apiKeyRequired: false,
            methodResponses: [
                DigitrafficMethodResponse.response200(Model.EMPTY_MODEL, MediaType.APPLICATION_JSON),
                DigitrafficMethodResponse.response500(Model.ERROR_MODEL, MediaType.APPLICATION_JSON)
            ]
        });

        this.restApi.documentResource(
            this.metadataResource,
            DocumentationPart.method(BETA_TAGS, "ListCameras", "List all camera metadata")
        );
    }

    createReadImageRole(): Role {
        const readImageRole = new Role(this.stack, "role", {
            assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
            path: "/service-role/"
        });

        this.bucket.grantRead(readImageRole);

        return readImageRole;
    }

    createImageResource(readImageRole: Role, ...resources: Resource[]): void {
        const getImageIntegration = new AwsIntegration({
            service: "s3",
            path: this.bucket.bucketName + "/images/Saimaa/{objectName}",
            integrationHttpMethod: "GET",
            options: {
                credentialsRole: readImageRole,
                requestParameters: {
                    "integration.request.path.objectName": "method.request.path.imageName"
                },
                integrationResponses: [
                    getResponse({
                        statusCode: "200",
                        contentHandling: ContentHandling.CONVERT_TO_BINARY,
                        responseParameters: {
                            "method.response.header.Access-Control-Allow-Origin": "'*'",
                            "method.response.header.Timestamp": "'integration.response.header.Date'",
                            "method.response.header.Content-Length":
                                "'integration.response.header.Content-Length'",
                            "method.response.header.Content-Type":
                                "'integration.response.header.Content-Type'"
                        }
                    }),
                    getResponse({
                        statusCode: "404",
                        selectionPattern: "404",
                        responseTemplates: {
                            [MediaType.APPLICATION_JSON]: "not found"
                        }
                    })
                ]
            }
        });

        resources.forEach((resource) =>
            resource.addMethod("GET", getImageIntegration, {
                apiKeyRequired: true,
                requestParameters: {
                    "method.request.path.imageName": true
                },
                methodResponses: [
                    //                    DigitrafficMethodResponse.response200(Model.EMPTY_MODEL, MediaType.IMAGE_JPEG),
                    // eslint-disable-next-line deprecation/deprecation
                    methodResponse("200", MediaType.IMAGE_JPEG, Model.EMPTY_MODEL, {
                        "method.response.header.Access-Control-Allow-Origin": true,
                        "method.response.header.Timestamp": true,
                        "method.response.header.Content-Type": true,
                        "method.response.header.Content-Length": true
                    }),
                    DigitrafficMethodResponse.response("403", Model.ERROR_MODEL, MediaType.TEXT_PLAIN),
                    DigitrafficMethodResponse.response("404", Model.ERROR_MODEL, MediaType.APPLICATION_JSON)
                ]
            })
        );
    }

    createGetImageResource(authorizer: RequestAuthorizer, readImageRole: Role): void {
        const getImageIntegration = new AwsIntegration({
            service: "s3",
            path: this.bucket.bucketName + "/images/{folderName}/{objectName}",
            integrationHttpMethod: "GET",
            options: {
                credentialsRole: readImageRole,
                requestParameters: {
                    "integration.request.path.objectName": "method.request.path.imageName",
                    "integration.request.path.folderName": "method.request.path.folderName"
                },
                integrationResponses: [
                    getResponse({
                        statusCode: "200",
                        contentHandling: ContentHandling.CONVERT_TO_BINARY,
                        responseParameters: {
                            "method.response.header.Access-Control-Allow-Origin": "'*'",
                            "method.response.header.Timestamp": "'integration.response.header.Date'",
                            "method.response.header.Content-Length":
                                "'integration.response.header.Content-Length'",
                            "method.response.header.Content-Type":
                                "'integration.response.header.Content-Type'"
                        }
                    }),
                    getResponse({
                        statusCode: "404",
                        selectionPattern: "404",
                        responseTemplates: {
                            [MediaType.APPLICATION_JSON]: "not found"
                        }
                    })
                ]
            }
        });
        this.imageResource.addMethod("GET", getImageIntegration, {
            authorizer,
            apiKeyRequired: false,
            requestParameters: {
                "method.request.path.imageName": true,
                "method.request.path.folderName": true
            },
            methodResponses: [
                // eslint-disable-next-line deprecation/deprecation
                methodResponse("200", MediaType.IMAGE_JPEG, Model.EMPTY_MODEL, {
                    "method.response.header.Access-Control-Allow-Origin": true,
                    "method.response.header.Timestamp": true,
                    "method.response.header.Content-Type": true,
                    "method.response.header.Content-Length": true
                }),

                DigitrafficMethodResponse.response("404", Model.ERROR_MODEL, MediaType.APPLICATION_JSON)
            ]
        });

        this.restApi.documentResource(
            this.imageResource,
            DocumentationPart.method(BETA_TAGS, "GetImage", "Return image")
        );
    }

    createLambdaAuthorizer(userPool: UserPool, userPoolClient: UserPoolClient): RequestAuthorizer {
        const functionName = "Marinecam-Authorizer";
        const environment: LambdaEnvironment = {
            [MarinecamEnvKeys.USERPOOL_ID]: userPool.userPoolId,
            [MarinecamEnvKeys.POOLCLIENT_ID]: userPoolClient.userPoolClientId
        };

        const authFunction = MonitoredFunction.create(
            this.stack,
            functionName,
            lambdaFunctionProps(this.stack, environment, functionName, "authorizer", {
                timeout: 10
            })
        );

        return new RequestAuthorizer(this.stack, "images-authorizer", {
            handler: authFunction,
            identitySources: [IdentitySource.header("Authorization")]
        });
    }
}
