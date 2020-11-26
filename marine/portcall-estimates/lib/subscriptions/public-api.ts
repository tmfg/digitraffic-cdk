import {EndpointType, LambdaIntegration, MethodLoggingLevel, RestApi} from '@aws-cdk/aws-apigateway';
import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {Construct} from "@aws-cdk/core";
import {Props} from "./app-props-subscriptions";
import {defaultLambdaConfiguration} from "../../../../common/stack/lambda-configs";
import {createSubscription} from "../../../../common/stack/subscription";
import {Table} from "@aws-cdk/aws-dynamodb";
import {createIpRestrictionPolicyDocument} from "../../../../common/api/rest_apis";

export function create(
    subscriptionInfoTable: Table,
    props: Props,
    stack: Construct) {
    const publicApi = createApi(props.allowFromIpAddresses, stack);
    const subscriptionInfoLambda = createsubscriptionInfoLambda(props, stack);
    subscriptionInfoTable.grantReadWriteData(subscriptionInfoLambda);
    createSubscriptionsResource(publicApi,
        props,
        subscriptionInfoLambda);
}

function createSubscriptionsResource(
    publicApi: RestApi,
    props: Props,
    createSubscriptionLambda: Function) {
    const resources = createResourcePaths(publicApi);
    const createSubscriptionIntegration = new LambdaIntegration(createSubscriptionLambda, {
        proxy: true
    });

    resources.addMethod("GET", createSubscriptionIntegration);
}

function createResourcePaths(publicApi: RestApi) {
    return publicApi.root.addResource("api").addResource("portcall-estimate-subscriptions");
}

function createApi(allowFromIpAddresses: string[], stack: Construct) {
    return new RestApi(stack, 'PortcallEstimateSubscriptions', {
        deployOptions: {
            loggingLevel: MethodLoggingLevel.ERROR,
        },
        description: 'Portcall estimate subscriptions',
        restApiName: 'PortcallEstimateSubscriptions public API',
        endpointTypes: [EndpointType.REGIONAL],
        policy: createIpRestrictionPolicyDocument(allowFromIpAddresses)
    });
}

function createsubscriptionInfoLambda(
    props: Props,
    stack: Construct): Function {
    const functionName = 'PortcallEstimateSubscriptions-GetSubscriptionInfo';
    const lambdaConf = defaultLambdaConfiguration({
        functionName: functionName,
        code: new AssetCode('dist/subscriptions/lambda/get-subscription-info'),
        handler: 'lambda-get-subscription-info.handler',
        reservedConcurrentExecutions: 1
    });

    const subscriptionInfoLambda = new Function(stack, functionName, lambdaConf);
    createSubscription(subscriptionInfoLambda, functionName, props.logsDestinationArn, stack);
    return subscriptionInfoLambda;
}
