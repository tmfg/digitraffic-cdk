import {RestApi,Resource}  from '@aws-cdk/aws-apigateway';
import {Function, AssetCode} from '@aws-cdk/aws-lambda';
import {LambdaIntegration} from "@aws-cdk/aws-apigateway";
import {Construct} from "@aws-cdk/core";
import {IVpc, ISecurityGroup} from '@aws-cdk/aws-ec2';
import {createSubscription} from "../../../common/stack/subscription";
import {dbLambdaConfiguration} from '../../../common/stack/lambda-configs';
import {createRestApi} from "../../../common/api/rest_apis";
import {Topic} from "@aws-cdk/aws-sns";
import {createUsagePlan} from "../../../common/stack/usage-plans";
import {KEY_SECRET_ID, KEY_SEND_FAULT_SNS_TOPIC_ARN} from "./lambda/upload-voyage-plan/lambda-upload-voyage-plan";
import {AtonProps} from "./app-props";

export function create(
    sendFaultTopic: Topic,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AtonProps,
    stack: Construct) {

    const integrationApi = createRestApi(
        stack,
        'ATONFaults-Integration',
        'ATON Faults integration API');
    createUsagePlan(integrationApi, 'ATON Faults CloudFront API Key', 'ATON Faults CloudFront Usage Plan');
    createUploadAreaHandler(sendFaultTopic, stack, integrationApi, vpc, lambdaDbSg, props);
}

function createUploadAreaHandler (
    sendFaultTopic: Topic,
    stack: Construct,
    integrationApi: RestApi,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AtonProps) {
    const handler = createHandler(sendFaultTopic, stack, vpc, lambdaDbSg, props);
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
    sendFaultTopic: Topic,
    stack: Construct,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AtonProps,
): Function {
    const functionName = 'ATONFaults-UploadVoyagePlan';
    const environment: any = {};
    environment[KEY_SECRET_ID] = props.secretId;
    environment[KEY_SEND_FAULT_SNS_TOPIC_ARN] = sendFaultTopic.topicArn;
    const handler = new Function(stack, functionName, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName,
        code: new AssetCode('dist/lambda/upload-voyage-plan'),
        handler: 'lambda-upload-voyage-plan.handler',
        environment
    }));
    createSubscription(handler, functionName, props.logsDestinationArn, stack);
    return handler;
}
