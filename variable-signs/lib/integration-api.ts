import apigateway = require('@aws-cdk/aws-apigateway');
import iam = require('@aws-cdk/aws-iam');
import * as lambda from '@aws-cdk/aws-lambda';
import {EndpointType, LambdaIntegration} from "@aws-cdk/aws-apigateway";
import {Construct} from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import {createSubscription} from "../../common/stack/subscription";
import {addDefaultValidator} from "../../common/api/utils";
import {MessageModel} from "../../common/api/response";
import {LambdaConfiguration} from "../../common/stack/lambda-configs";
import {dbLambdaConfiguration} from '../../common/stack/lambda-configs';

export function create(vpc: ec2.IVpc, lambdaDbSg: ec2.ISecurityGroup, props: LambdaConfiguration, stack: Construct) {
    const integrationApi = createApi(stack);
    createRequestsResource(stack, integrationApi, vpc, lambdaDbSg, props);
    createUsagePlan(integrationApi);
}

function createApi(stack: Construct) {
    return new apigateway.RestApi(stack, 'VariableSigns-integration', {
        deployOptions: {
            loggingLevel: apigateway.MethodLoggingLevel.ERROR,
        },
        restApiName: 'Variable Signs integration API',
        endpointTypes: [EndpointType.REGIONAL],
        policy: new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        "execute-api:Invoke"
                    ],
                    resources: [
                        "*"
                    ],
                    principals: [
                        new iam.AnyPrincipal()
                    ]
                })
            ]
        })
    });
}

function createRequestsResource(
    stack: Construct,
    integrationApi: apigateway.RestApi,
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: LambdaConfiguration) {
    const validator = addDefaultValidator(integrationApi);
    const apiResource = integrationApi.root.addResource("api");
    const v1Resource = apiResource.addResource("v1");
    const vsResource = v1Resource.addResource("variable-signs");
    const datex2Resource = vsResource.addResource("datex2");
    const messageResponseModel = integrationApi.addModel('MessageResponseModel', MessageModel);

    createUpdateRequestHandler(datex2Resource, stack, vpc, lambdaDbSg, props);
}

function createUpdateRequestHandler(
    requests: apigateway.Resource,
    stack: Construct,
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: LambdaConfiguration
) {
    const updateRequestsId = 'UpdateRequests';
    const updateRequestsHandler = new lambda.Function(stack, updateRequestsId, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: updateRequestsId,
        code: new lambda.AssetCode('dist/lambda/update-datex2'),
        handler: 'lambda-update-datex2.handler'
    }));
    requests.addMethod("POST", new LambdaIntegration(updateRequestsHandler), {
        apiKeyRequired: true
    });
    createSubscription(updateRequestsHandler, updateRequestsId, props.logsDestinationArn, stack);
}

function createUsagePlan(integrationApi: apigateway.RestApi) {
    const apiKey = integrationApi.addApiKey('Integration API key');
    const plan = integrationApi.addUsagePlan('Integration Usage Plan', {
        name: 'Integration Usage Plan',
        apiKey
    });
    plan.addApiStage({
        stage: integrationApi.deploymentStage
    });
}
