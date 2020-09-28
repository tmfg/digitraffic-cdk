import {EndpointType, MethodLoggingLevel, Model, RequestValidator, RestApi} from '@aws-cdk/aws-apigateway';
import {AnyPrincipal, Effect, PolicyDocument, PolicyStatement} from '@aws-cdk/aws-iam';
import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {Construct} from "@aws-cdk/core";
import {SubscriptionSchema} from './model/subscription-schema';
import {corsMethodJsonResponse, defaultIntegration,} from "../../../../common/api/responses";
import {MessageModel} from "../../../../common/api/response";
import {addDefaultValidator, addServiceModel} from "../../../../common/api/utils";
import {Props} from "./app-props-subscriptions";
import {addTags} from "../../../../common/api/documentation";
import {createUsagePlan} from "../../../../common/stack/usage-plans";
import {dbLambdaConfiguration} from "../../../../common/stack/lambda-configs";
import {createSubscription} from "../../../../common/stack/subscription";
import {Table} from "@aws-cdk/aws-dynamodb";

export function create(
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    subscriptionTable: Table,
    props: Props,
    stack: Construct) {
    const publicApi = createApi(stack);

    createUsagePlan(publicApi, 'Portcall estimate subscriptions Api Key', 'Portcall estimates subscriptions Usage Plan');

    const validator = addDefaultValidator(publicApi);

    const subscriptionModel = addServiceModel("SubscriptionModel", publicApi, SubscriptionSchema);

    const subscriptionCreatorLambda = createSubscriptionCreatorLambda(vpc,
        lambdaDbSg,
        props,
        stack);

    subscriptionTable.grantReadWriteData(subscriptionCreatorLambda);

    createSubscriptionsResource(publicApi,
        vpc,
        props,
        lambdaDbSg,
        subscriptionCreatorLambda,
        subscriptionModel,
        validator,
        stack);
}

function createSubscriptionsResource(
    publicApi: RestApi,
    vpc: IVpc,
    props: Props,
    lambdaDbSg: ISecurityGroup,
    createSubscriptionLambda: Function,
    subscriptionModel: Model,
    validator: RequestValidator,
    stack: Construct) {
    const errorResponseModel = publicApi.addModel('MessageResponseModel', MessageModel);
    const resources = createResourcePaths(publicApi);
    const createSubscriptionIntegration = defaultIntegration(createSubscriptionLambda);

    resources.addMethod("POST", createSubscriptionIntegration, {
        apiKeyRequired: true,
        requestValidator: validator,
        requestModels: {
            'application/json': subscriptionModel,
        },
        methodResponses: [
            corsMethodJsonResponse("200", Model.EMPTY_MODEL),
            corsMethodJsonResponse("500", errorResponseModel)
        ]
    });

    addTags('CreateSubscription', ['portcall-estimate-subscriptions'], resources, stack);
}

function createResourcePaths(publicApi: RestApi) {
    return publicApi.root.addResource("api")
        .addResource("portcall-estimate-subscriptions");
}

function createApi(stack: Construct) {
    return new RestApi(stack, 'PortcallEstimateSubscriptions', {
        deployOptions: {
            loggingLevel: MethodLoggingLevel.ERROR,
        },
        description: 'Portcall estimate subscriptions',
        restApiName: 'PortcallEstimateSubscriptions public API',
        endpointTypes: [EndpointType.REGIONAL],
        policy: new PolicyDocument({
            statements: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: [
                        "execute-api:Invoke"
                    ],
                    resources: [
                        "*"
                    ],
                    principals: [
                        new AnyPrincipal()
                    ]
                })
            ]
        })
    });
}

function createSubscriptionCreatorLambda(
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: Props,
    stack: Construct): Function {
    const functionName = 'PortcallEstimateSubscriptions-CreateSubscription';
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: new AssetCode('dist/subscriptions/lambda/create-subscription'),
        handler: 'lambda-create-subscription.handler',
        environment: {
            DB_USER: props.dbProps.username,
            DB_PASS: props.dbProps.password,
            DB_URI: props.dbProps.uri,
            PINPOINT_ID: props.pinpointApplicationId,
            PINPOINT_NUMBER: props.pinpointTelephoneNumber,
        },
        reservedConcurrentExecutions: props.sqsProcessLambdaConcurrentExecutions
    });

    const subscriptionCreatorLambda = new Function(stack, functionName, lambdaConf);
    createSubscription(subscriptionCreatorLambda, functionName, props.logsDestinationArn, stack);
    return subscriptionCreatorLambda;
}