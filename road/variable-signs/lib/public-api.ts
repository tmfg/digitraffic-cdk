import {dbLambdaConfiguration, LambdaConfiguration} from "../../../common/stack/lambda-configs";
import {createUsagePlan} from "../../../common/stack/usage-plans";
import {addSimpleServiceModel} from "../../../common/api/utils";
import {Construct} from "@aws-cdk/core";
import {RestApi} from '@aws-cdk/aws-apigateway';
import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {
    corsHeaders,
    corsMethodSvgResponse,
    corsMethodXmlResponse,
    defaultIntegration, getResponse, methodResponse,
    RESPONSE_200_OK,
    RESPONSE_400_BAD_REQUEST
} from "../../../common/api/responses";
import {createSubscription} from "../../../common/stack/subscription";
import {addTags} from "../../../common/api/documentation";
import {BETA_TAGS} from "../../../common/api/tags";
import {MessageModel} from "../../../common/api/response";
import {createRestApi} from "../../../common/api/rest_apis";

export function create(vpc: IVpc, lambdaDbSg: ISecurityGroup, props: LambdaConfiguration, stack: Construct) {
    const publicApi = createRestApi(stack, 'VariableSigns-public', 'VariableSigns public API', undefined);

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

    const textFunctionName = 'VS-GetText';
    const getSignTextGraphicsLambda = new Function(stack, textFunctionName, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: textFunctionName,
        code: new AssetCode('dist/lambda/get-sign-text'),
        handler: 'lambda-get-sign-text.handler',
        readOnly: true
    }));

    const getDatex2Integration = defaultIntegration(getDatex2Lambda, {xml: true});
    const errorResponseModel = publicApi.addModel('MessageResponseModel', MessageModel);
    const xmlModel = addSimpleServiceModel('XmlModel', publicApi);
    const svgModel = addSimpleServiceModel('SvgModel', publicApi, 'image/svg+xml')

    const apiResource = publicApi.root.addResource("api");
    const v1Resource = apiResource.addResource("v1");
    const betaResource = apiResource.addResource("beta");
    const vsResource = betaResource.addResource("variable-signs");
    const datex2Resource = vsResource.addResource("datex2");
    const imagesResource = vsResource.addResource("images");
    const imageResource = imagesResource.addResource("{text}");

    datex2Resource.addMethod("GET", getDatex2Integration, {
        apiKeyRequired: true,
        methodResponses: [
            corsMethodXmlResponse("200", xmlModel),
            corsMethodXmlResponse("500", errorResponseModel)
        ]
    });

    createSubscription(getDatex2Lambda, functionName, props.logsDestinationArn, stack);
    addTags('GetDatex2', BETA_TAGS, datex2Resource, stack);

    const getSignTextIntegration = defaultIntegration(getSignTextGraphicsLambda, {
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
    imageResource.addMethod("GET", getSignTextIntegration, {
        apiKeyRequired: true,
        requestParameters: {
            'method.request.path.text': true
        },
        methodResponses: [
            corsMethodSvgResponse("200", svgModel),
            corsHeaders(methodResponse("400", "application/xml", errorResponseModel))
        ]
    });

    return getDatex2Lambda;
}
