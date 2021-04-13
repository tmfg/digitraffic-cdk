import {GatewayResponse, Model, PassthroughBehavior, Resource, ResponseType, RestApi} from '@aws-cdk/aws-apigateway';
import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {Construct} from "@aws-cdk/core";
import {createSubscription} from "../../../common/stack/subscription";
import {defaultLambdaConfiguration} from '../../../common/stack/lambda-configs';
import {createRestApi} from "../../../common/api/rest_apis";
import {createUsagePlan} from "../../../common/stack/usage-plans";
import {KEY_SECRET_ID} from "./lambda/upload-voyage-plan/lambda-upload-voyage-plan";
import {VoyagePlanGatewayProps} from "./app-props";
import {defaultIntegration, methodResponse} from "../../../common/api/responses";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {MediaType} from "../../../common/api/mediatypes";
import {MessageModel} from "../../../common/api/response";
import {addQueryParameterDescription, addTagsAndSummary} from "../../../common/api/documentation";
import {IVpc} from "@aws-cdk/aws-ec2";

export function create(
    secret: ISecret,
    vpc: IVpc,
    props: VoyagePlanGatewayProps,
    stack: Construct) {

    const integrationApi = createRestApi(
        stack,
        'VPGW-Integration',
        'VPGW Faults integration API');
    // set response for missing auth token to 501 as desired by API registrar
    new GatewayResponse(stack, 'MissingAuthenticationTokenResponse', {
        restApi: integrationApi,
        type: ResponseType.MISSING_AUTHENTICATION_TOKEN,
        statusCode: '501',
        templates: {
            'application/json': 'Not implemented'
        }
    });
    createUsagePlan(integrationApi, 'VPGW Faults CloudFront API Key', 'VPGW Faults CloudFront Usage Plan');
    const messageResponseModel = integrationApi.addModel('MessageResponseModel', MessageModel);
    createUploadVoyagePlanHandler(messageResponseModel, secret, stack, integrationApi, vpc, props);
}

function createUploadVoyagePlanHandler(
    messageResponseModel: Model,
    secret: ISecret,
    stack: Construct,
    integrationApi: RestApi,
    vpc: IVpc,
    props: VoyagePlanGatewayProps) {

    const handler = createHandler(stack, vpc, props);
    secret.grantRead(handler);
    const resource = integrationApi.root.addResource("voyagePlans")
    createIntegrationResource(stack, messageResponseModel, resource, handler);
}

function createIntegrationResource(
    stack: Construct,
    messageResponseModel: Model,
    resource: Resource,
    handler: Function) {

    const integration = defaultIntegration(handler, {
        passthroughBehavior: PassthroughBehavior.NEVER,
        disableCors: true,
        requestParameters: {
            'integration.request.querystring.callbackEndpoint': 'method.request.querystring.callbackEndpoint'
        },
        requestTemplates: {
            // transformation from XML to JSON in API Gateway
            // some stuff needs to be quotes, other stuff does not, it's magic
            'text/xml': `{
                "callbackEndpoint": "$util.escapeJavaScript($input.params('callbackEndpoint'))",
                "voyagePlan": $input.json('$')
            }`
        }
    });
    resource.addMethod("POST", integration, {
        apiKeyRequired: true,
        requestParameters: {
            'method.request.querystring.callbackEndpoint': false
        },
        methodResponses: [
            methodResponse("200", MediaType.APPLICATION_JSON, messageResponseModel),
            methodResponse("400", MediaType.APPLICATION_JSON, messageResponseModel),
            methodResponse("500", MediaType.APPLICATION_JSON, messageResponseModel)
        ]
    });
    addQueryParameterDescription(
        'callbackEndpoint',
        'URL endpoint where S-124 VPGW faults are sent',
        resource,
        stack);
    addTagsAndSummary(
        'VPGW Faults',
        ['API'],
        'Upload voyage plan in RTZ format in HTTP POST body. Active VPGW faults relevant to the voyage plan are sent back in S-124 format if the query parameter callbackEndpoint is supplied.',
        resource,
        stack);
}

function createHandler(
    stack: Construct,
    vpc: IVpc,
    props: VoyagePlanGatewayProps,
): Function {
    const functionName = 'VPGW-UploadVoyagePlan';
    const environment: any = {};
    environment[KEY_SECRET_ID] = props.secretId;
    const handler = new Function(stack, functionName, defaultLambdaConfiguration({
        functionName,
        code: new AssetCode('dist/lambda'),
        handler: 'lambda-upload-voyage-plan.handler',
        environment,
        vpc: vpc
    }));
    createSubscription(handler, functionName, props.logsDestinationArn, stack);
    return handler;
}
