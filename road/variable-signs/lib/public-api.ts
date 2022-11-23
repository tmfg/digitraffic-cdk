import { addSimpleServiceModel } from "@digitraffic/common/utils/api-model";
import {
    corsMethod,
    defaultIntegration,
    methodResponse,
} from "@digitraffic/common/dist/aws/infra/api/responses";
import { DigitrafficIntegration } from "@digitraffic/common/dist/aws/infra/api/integration";
import { DocumentationPart } from "@digitraffic/common/dist/aws/infra/documentation";
import { DATA_V1_TAGS } from "@digitraffic/common/dist/aws/types/tags";
import { MessageModel } from "@digitraffic/common/dist/aws/infra/api/response";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { Resource } from "aws-cdk-lib/aws-apigateway";

const VARIABLE_SIGN_TAGS_V1 = ["Variable Sign V1"];
const DEPRECATION = "Will be removed after 2023-01-01";

export class PublicApi {
    readonly restApi: DigitrafficRestApi;

    private apiResource: Resource;
    private datex2Resource: Resource;
    private imageResource: Resource;
    private v1Datex2Resource: Resource;
    private v1ImageResource: Resource;

    constructor(stack: DigitrafficStack) {
        this.restApi = new DigitrafficRestApi(
            stack,
            "VariableSigns-public",
            "Variable Signs public API"
        );

        this.restApi.createUsagePlan(
            "VariableSigns Api Key",
            "VariableSigns Usage Plan"
        );

        this.createOldResourcePaths();
        this.createV1ResourcePaths();
        this.createDatex2Resource(stack);

        this.createDocumentation();
        this.createV1Documentation();
    }

    createOldResourcePaths() {
        this.apiResource = this.restApi.root.addResource("api");
        const v1Resource = this.apiResource.addResource("v1");
        const vsResource = v1Resource.addResource("variable-signs");

        const imagesResource = vsResource.addResource("images");

        this.datex2Resource = vsResource.addResource("datex2");
        this.imageResource = imagesResource.addResource("{text}");
    }

    createV1ResourcePaths() {
        const vsResource = this.apiResource.addResource("variable-sign");
        const v1Resource = vsResource.addResource("v1");

        const imagesResource = v1Resource.addResource("images");

        this.v1Datex2Resource = v1Resource.addResource("signs.datex2");
        this.v1ImageResource = imagesResource.addResource("{text}");
    }

    createDocumentation() {
        // set deprecated?!
        this.restApi.documentResource(
            this.datex2Resource,
            DocumentationPart.method(
                DATA_V1_TAGS,
                "GetDatex2",
                "Return all variables signs as datex2"
            ).deprecated(DEPRECATION)
        );

        this.restApi.documentResource(
            this.imageResource,
            DocumentationPart.method(
                DATA_V1_TAGS,
                "GetImage",
                "Generate svg-image from given text"
            ).deprecated(DEPRECATION),
            DocumentationPart.queryParameter(
                "text",
                "formatted [text] from variable sign text rows, without the brackets"
            )
        );
    }

    createV1Documentation() {
        this.restApi.documentResource(
            this.v1Datex2Resource,
            DocumentationPart.method(
                VARIABLE_SIGN_TAGS_V1,
                "GetDatex2",
                "Return all variables signs as datex2"
            )
        );

        this.restApi.documentResource(
            this.v1ImageResource,
            DocumentationPart.method(
                VARIABLE_SIGN_TAGS_V1,
                "GetImage",
                "Generate svg-image from given text"
            ),
            DocumentationPart.queryParameter(
                "text",
                "formatted [text] from variable sign text rows, without the brackets"
            )
        );
    }

    createDatex2Resource(stack: DigitrafficStack) {
        const environment = stack.createLambdaEnvironment();

        const getDatex2Lambda = MonitoredDBFunction.create(
            stack,
            "get-datex2",
            environment,
            {
                reservedConcurrentExecutions: 3,
            }
        );

        const getImageLambda = MonitoredDBFunction.create(
            stack,
            "get-sign-image",
            {},
            {
                reservedConcurrentExecutions: 3,
            }
        );

        const getDatex2Integration = new DigitrafficIntegration(
            getDatex2Lambda,
            MediaType.APPLICATION_XML
        ).build();
        const errorResponseModel = this.restApi.addModel(
            "MessageResponseModel",
            MessageModel
        );
        const xmlModel = addSimpleServiceModel("XmlModel", this.restApi);
        const svgModel = addSimpleServiceModel(
            "SvgModel",
            this.restApi,
            MediaType.IMAGE_SVG
        );

        ["GET", "HEAD"].forEach((httpMethod) => {
            this.datex2Resource.addMethod(httpMethod, getDatex2Integration, {
                apiKeyRequired: true,
                methodResponses: [
                    corsMethod(
                        methodResponse(
                            "200",
                            MediaType.APPLICATION_XML,
                            xmlModel
                        )
                    ),
                    corsMethod(
                        methodResponse(
                            "500",
                            MediaType.APPLICATION_XML,
                            errorResponseModel
                        )
                    ),
                ],
            });

            this.v1Datex2Resource.addMethod(httpMethod, getDatex2Integration, {
                apiKeyRequired: true,
                methodResponses: [
                    corsMethod(
                        methodResponse(
                            "200",
                            MediaType.APPLICATION_XML,
                            xmlModel
                        )
                    ),
                    corsMethod(
                        methodResponse(
                            "500",
                            MediaType.APPLICATION_XML,
                            errorResponseModel
                        )
                    ),
                ],
            });
        });

        const getImageIntegration = new DigitrafficIntegration(
            getImageLambda,
            MediaType.IMAGE_SVG
        )
            .addPathParameter("text")
            .build();

        ["GET", "HEAD"].forEach((httpMethod) => {
            this.imageResource.addMethod(httpMethod, getImageIntegration, {
                apiKeyRequired: true,
                requestParameters: {
                    "method.request.path.text": true,
                },
                methodResponses: [
                    corsMethod(
                        methodResponse("200", MediaType.IMAGE_SVG, svgModel)
                    ),
                    corsMethod(
                        methodResponse(
                            "400",
                            MediaType.TEXT_PLAIN,
                            errorResponseModel
                        )
                    ),
                ],
            });

            this.v1ImageResource.addMethod(httpMethod, getImageIntegration, {
                apiKeyRequired: true,
                requestParameters: {
                    "method.request.path.text": true,
                },
                methodResponses: [
                    corsMethod(
                        methodResponse("200", MediaType.IMAGE_SVG, svgModel)
                    ),
                    corsMethod(
                        methodResponse(
                            "400",
                            MediaType.TEXT_PLAIN,
                            errorResponseModel
                        )
                    ),
                ],
            });
        });
    }
}
