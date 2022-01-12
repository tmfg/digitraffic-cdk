import {createUsagePlan} from "digitraffic-common/aws/infra/usage-plans";
import {addSimpleServiceModel} from "digitraffic-common/utils/api-model";
import {RestApi} from 'aws-cdk-lib/aws-apigateway';
import {Function} from 'aws-cdk-lib/aws-lambda';
import {corsMethod, defaultIntegration, methodResponse} from "digitraffic-common/aws/infra/api/responses";
import {DigitrafficLogSubscriptions} from "digitraffic-common/aws/infra/stack/subscription";
import {addQueryParameterDescription, addTagsAndSummary} from "digitraffic-common/aws/infra/documentation";
import {DATA_V1_TAGS} from "digitraffic-common/aws/types/tags";
import {MessageModel} from "digitraffic-common/aws/infra/api/response";
import {DigitrafficRestApi} from "digitraffic-common/aws/infra/stack/rest_apis";
import {MediaType} from "digitraffic-common/aws/types/mediatypes";
import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {MonitoredFunction} from "digitraffic-common/aws/infra/stack/monitoredfunction";
import {DigitrafficIntegrationResponse} from "digitraffic-common/aws/infra/digitraffic-integration-response";

export function create(stack: DigitrafficStack) {
    const publicApi = new DigitrafficRestApi(stack, 'VariableSigns-public', 'Variable Signs public API');

    createUsagePlan(publicApi, 'VariableSigns Api Key', 'VariableSigns Usage Plan');

    return createDatex2Resource(stack, publicApi);
}

function createDatex2Resource(stack: DigitrafficStack, publicApi: RestApi): Function {
    const environment = stack.createLambdaEnvironment();

    const getDatex2Lambda = MonitoredFunction.createV2(stack, 'get-datex2', environment, {
        reservedConcurrentExecutions: 3,
    });

    const getImageLambda = MonitoredFunction.createV2(stack, 'get-sign-image', {}, {
        reservedConcurrentExecutions: 3,
    });

    stack.grantSecret(getDatex2Lambda, getImageLambda);
    new DigitrafficLogSubscriptions(stack, getDatex2Lambda, getImageLambda);

    const getDatex2Integration = defaultIntegration(getDatex2Lambda, {xml: true});
    const errorResponseModel = publicApi.addModel('MessageResponseModel', MessageModel);
    const xmlModel = addSimpleServiceModel('XmlModel', publicApi);
    const svgModel = addSimpleServiceModel('SvgModel', publicApi, 'image/svg+xml');

    const apiResource = publicApi.root.addResource("api");
    const v1Resource = apiResource.addResource("v1");
    const vsResource = v1Resource.addResource("variable-signs");
    const datex2Resource = vsResource.addResource("datex2");
    const imagesResource = vsResource.addResource("images");
    const imageResource = imagesResource.addResource("{text}");

    ['GET', 'HEAD'].forEach(httpMethod => {
        datex2Resource.addMethod(httpMethod, getDatex2Integration, {
            apiKeyRequired: true,
            methodResponses: [
                corsMethod(methodResponse("200", MediaType.APPLICATION_XML, xmlModel)),
                corsMethod(methodResponse("500", MediaType.APPLICATION_XML, errorResponseModel)),
            ],
        });
    });

    addTagsAndSummary(
        'GetDatex2', DATA_V1_TAGS, 'Return all variables signs as datex2', datex2Resource, stack,
    );

    const getImageIntegration = defaultIntegration(getImageLambda, {
        xml: true,
        requestParameters: {
            'integration.request.path.text': 'method.request.path.text',
        },
        requestTemplates: {
            'application/json': JSON.stringify({text: "$util.escapeJavaScript($input.params('text'))"}),
        },
        responses: [DigitrafficIntegrationResponse.ok(MediaType.IMAGE_SVG)],
    });
    imageResource.addMethod("GET", getImageIntegration, {
        apiKeyRequired: true,
        requestParameters: {
            'method.request.path.text': true,
        },
        methodResponses: [
            corsMethod(methodResponse("200", MediaType.IMAGE_SVG, svgModel)),
            corsMethod(methodResponse("400", MediaType.TEXT_PLAIN, errorResponseModel)),

        ],
    });

    addTagsAndSummary(
        'GetImage', DATA_V1_TAGS, 'Generate svg-image from given text', imageResource, stack,
    );
    addQueryParameterDescription('text', 'formatted [text] from variable sign textrows, without the brackets', imageResource, stack);

    return getDatex2Lambda;
}
