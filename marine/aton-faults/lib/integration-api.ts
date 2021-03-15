import {RestApi,Resource}  from '@aws-cdk/aws-apigateway';
import {Function, AssetCode} from '@aws-cdk/aws-lambda';
import {LambdaIntegration} from "@aws-cdk/aws-apigateway";
import {Construct} from "@aws-cdk/core";
import {IVpc, ISecurityGroup} from '@aws-cdk/aws-ec2';
import {createSubscription} from "../../../common/stack/subscription";
import {LambdaConfiguration} from "../../../common/stack/lambda-configs";
import {dbLambdaConfiguration} from '../../../common/stack/lambda-configs';
import {createRestApi} from "../../../common/api/rest_apis";
import {Topic} from "@aws-cdk/aws-sns";

export function create(
    sendFaultTopic: Topic,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: LambdaConfiguration,
    stack: Construct) {

    const integrationApi = createRestApi(
        stack,
        'MarineConnectivity-Integration',
        'Marine Connectivity integration API');
    createUploadAreaHandler(sendFaultTopic, stack, integrationApi, vpc, lambdaDbSg, props);
}

function createUploadAreaHandler (
    sendFaultTopic: Topic,
    stack: Construct,
    integrationApi: RestApi,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: LambdaConfiguration) {
    const handler = createHandler(stack, vpc, lambdaDbSg, props);
    const resource = integrationApi.root.addResource("upload-area")
    createIntegrationResource(resource, handler);
    sendFaultTopic.grantPublish(handler);
}

function createIntegrationResource(resource: Resource, handler: Function) {
    resource.addMethod("POST", new LambdaIntegration(handler, {
        requestParameters: {
            'integration.request.querystring.callbackEndpoint': 'method.request.querystring.callbackEndpoint',
            'integration.request.querystring.deliveryAckEndPoint': 'method.request.querystring.deliveryAckEndPoint'
        },
        requestTemplates: {
            'application/json': JSON.stringify({
                callbackEndpoint: "$util.escapeJavaScript($input.params('callbackEndpoint'))",
                deliveryAckEndPoint: "$util.escapeJavaScript($input.params('deliveryAckEndPoint'))"
            })
        }
    }), {
        requestParameters: {
            'integration.request.querystring.callbackEndpoint': false,
            'integration.request.querystring.deliveryAckEndPoint': false
        }
    });
}

function createHandler(
    stack: Construct,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: LambdaConfiguration,
): Function {
    const functionName = 'MarineConnectivity-UploadVoyagePlan';
    const handler = new Function(stack, functionName, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName,
        code: new AssetCode('dist/lambda/upload-voyage-plan'),
        handler: 'lambda-updload-voyage-plan.handler'
    }));
    createSubscription(handler, functionName, props.logsDestinationArn, stack);
    return handler;
}
