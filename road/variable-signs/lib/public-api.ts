import {addSimpleServiceModel} from "digitraffic-common/utils/api-model";
import {corsMethod, defaultIntegration, methodResponse} from "digitraffic-common/aws/infra/api/responses";
import {DocumentationPart} from "digitraffic-common/aws/infra/documentation";
import {DATA_V1_TAGS} from "digitraffic-common/aws/types/tags";
import {MessageModel} from "digitraffic-common/aws/infra/api/response";
import {DigitrafficRestApi} from "digitraffic-common/aws/infra/stack/rest_apis";
import {MediaType} from "digitraffic-common/aws/types/mediatypes";
import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {MonitoredDBFunction} from "digitraffic-common/aws/infra/stack/monitoredfunction";
import {DigitrafficIntegrationResponse} from "digitraffic-common/aws/runtime/digitraffic-integration-response";
import {Resource} from 'aws-cdk-lib/aws-apigateway';

export class PublicApi {
    readonly restApi: DigitrafficRestApi;
    private datex2Resource: Resource;
    private imageResource: Resource;

    constructor(stack: DigitrafficStack) {
        this.restApi = new DigitrafficRestApi(stack, 'VariableSigns-public', 'Variable Signs public API');

        this.restApi.createUsagePlan( 'VariableSigns Api Key', 'VariableSigns Usage Plan');

        this.createResourcePaths();
        this.createDatex2Resource(stack);
        this.createDocumentation();
    }

    createResourcePaths() {
        const apiResource = this.restApi.root.addResource("api");
        const v1Resource = apiResource.addResource("v1");
        const vsResource = v1Resource.addResource("variable-signs");

        const imagesResource = vsResource.addResource("images");

        this.datex2Resource = vsResource.addResource("datex2");
        this.imageResource = imagesResource.addResource("{text}");
    }

    createDocumentation() {
        this.restApi.documentResource(this.datex2Resource,
            DocumentationPart.method(DATA_V1_TAGS, 'GetDatex2', 'Return all variables signs as datex2'));

        this.restApi.documentResource(this.imageResource,
            DocumentationPart.method(DATA_V1_TAGS, 'GetImage', 'Generate svg-image from given text'),
            DocumentationPart.queryParameter('text', 'formatted [text] from variable sign text rows, without the brackets'));
    }

    createDatex2Resource(stack: DigitrafficStack) {
        const environment = stack.createLambdaEnvironment();

        const getDatex2Lambda = MonitoredDBFunction.create(stack, 'get-datex2', environment, {
            reservedConcurrentExecutions: 3,
        });

        const getImageLambda = MonitoredDBFunction.create(stack, 'get-sign-image', {}, {
            reservedConcurrentExecutions: 3,
        });

        const getDatex2Integration = defaultIntegration(getDatex2Lambda, {xml: true});
        const errorResponseModel = this.restApi.addModel('MessageResponseModel', MessageModel);
        const xmlModel = addSimpleServiceModel('XmlModel', this.restApi);
        const svgModel = addSimpleServiceModel('SvgModel', this.restApi, MediaType.IMAGE_SVG);

        ['GET', 'HEAD'].forEach(httpMethod => {
            this.datex2Resource.addMethod(httpMethod, getDatex2Integration, {
                apiKeyRequired: true,
                methodResponses: [
                    corsMethod(methodResponse("200", MediaType.APPLICATION_XML, xmlModel)),
                    corsMethod(methodResponse("500", MediaType.APPLICATION_XML, errorResponseModel)),
                ],
            });
        });

        const getImageIntegration = defaultIntegration(getImageLambda, {
            xml: false,
            requestParameters: {
                'integration.request.path.text': 'method.request.path.text',
            },
            requestTemplates: {
                'application/json': JSON.stringify({text: "$util.escapeJavaScript($input.params('text'))"}),
            },
            responses: [DigitrafficIntegrationResponse.ok(MediaType.IMAGE_SVG)],
        });
        this.imageResource.addMethod("GET", getImageIntegration, {
            apiKeyRequired: true,
            requestParameters: {
                'method.request.path.text': true,
            },
            methodResponses: [
                corsMethod(methodResponse("200", MediaType.IMAGE_SVG, svgModel)),
                corsMethod(methodResponse("400", MediaType.TEXT_PLAIN, errorResponseModel)),
            ],
        });
    }
}