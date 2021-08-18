import {
    dbLambdaConfiguration,
    defaultLambdaConfiguration,
    LambdaConfiguration
} from "digitraffic-common/stack/lambda-configs";
import {createUsagePlan} from "digitraffic-common/stack/usage-plans";
import {addSimpleServiceModel} from "digitraffic-common/api/utils";
import {Construct} from "@aws-cdk/core";
import {RestApi} from '@aws-cdk/aws-apigateway';
import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {
    corsMethod,
    defaultIntegration, getResponse, methodResponse,
    RESPONSE_200_OK,
    RESPONSE_400_BAD_REQUEST
} from "digitraffic-common/api/responses";
import {createSubscription} from "digitraffic-common/stack/subscription";
import {addQueryParameterDescription, addTagsAndSummary} from "digitraffic-common/api/documentation";
import {DATA_V1_TAGS} from "digitraffic-common/api/tags";
import {MessageModel} from "digitraffic-common/api/response";
import {createRestApi} from "digitraffic-common/api/rest_apis";
import {MediaType} from "digitraffic-common/api/mediatypes";

export function create(vpc: IVpc, lambdaDbSg: ISecurityGroup, props: LambdaConfiguration, stack: Construct) {
    const publicApi = createRestApi(stack, 'VariableSigns-public', 'Variable Signs public API');

    createUsagePlan(publicApi, 'VariableSigns Api Key', 'VariableSigns Usage Plan');

    return createDatex2Resource(publicApi, vpc, props, lambdaDbSg, stack)
}

function createDatex2Resource(
    publicApi: RestApi,
    vpc: IVpc,
    props: LambdaConfiguration,
    lambdaDbSg: ISecurityGroup,
    stack: Construct): Function {

    const functionName = 'VS-GetDatex2';
    const getDatex2Lambda = new Function(stack, functionName, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: new AssetCode('dist/lambda/get-datex2'),
        handler: 'lambda-get-datex2.handler',
        readOnly: true
    }));

    const imageFunctionName = 'VS-GetImage';
    const getImageLambda = new Function(stack, imageFunctionName, defaultLambdaConfiguration({
        functionName: imageFunctionName,
        code: new AssetCode('dist/lambda/get-sign-image'),
        handler: 'lambda-get-sign-image.handler',
        readOnly: true
    }));

    const getDatex2Integration = defaultIntegration(getDatex2Lambda, {xml: true});
    const errorResponseModel = publicApi.addModel('MessageResponseModel', MessageModel);
    const xmlModel = addSimpleServiceModel('XmlModel', publicApi);
    const svgModel = addSimpleServiceModel('SvgModel', publicApi, 'image/svg+xml')

    const apiResource = publicApi.root.addResource("api");
    const v1Resource = apiResource.addResource("v1");
    const vsResource = v1Resource.addResource("variable-signs");
    const datex2Resource = vsResource.addResource("datex2");
    const imagesResource = vsResource.addResource("images");
    const imageResource = imagesResource.addResource("{text}");

    datex2Resource.addMethod("GET", getDatex2Integration, {
        apiKeyRequired: true,
        methodResponses: [
            corsMethod(methodResponse("200", MediaType.APPLICATION_XML, xmlModel)),
            corsMethod(methodResponse("500", MediaType.APPLICATION_XML, errorResponseModel))
        ]
    });

    createSubscription(getDatex2Lambda, functionName, props.logsDestinationArn, stack);
    addTagsAndSummary('GetDatex2', DATA_V1_TAGS, 'Return all variables signs as datex2', datex2Resource, stack);

    const getImageIntegration = defaultIntegration(getImageLambda, {
        xml: true,
        requestParameters: {
            'integration.request.path.text': 'method.request.path.text'
        },
        requestTemplates: {
            'application/json': JSON.stringify({text: "$util.escapeJavaScript($input.params('text'))"})
        },
        responses: [
            getResponse(RESPONSE_200_OK, {xml: true}),
            getResponse(RESPONSE_400_BAD_REQUEST)
        ]
    });
    imageResource.addMethod("GET", getImageIntegration, {
        apiKeyRequired: true,
        requestParameters: {
            'method.request.path.text': true
        },
        methodResponses: [
            corsMethod(methodResponse("200", MediaType.IMAGE_SVG, svgModel)),
            corsMethod(methodResponse("400", MediaType.APPLICATION_JSON, errorResponseModel))
        ]
    });

    createSubscription(getImageLambda, imageFunctionName, props.logsDestinationArn, stack);
    addTagsAndSummary('GetImage', DATA_V1_TAGS, 'Generate svg-image from given text', imageResource, stack);
    addQueryParameterDescription('text', 'formatted [text] from variable sign textrows, without the brackets', imageResource, stack);

    return getDatex2Lambda;
}
