import {LambdaIntegration, Resource, RestApi} from '@aws-cdk/aws-apigateway';
import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {createSubscription} from "digitraffic-common/stack/subscription";
import {dbFunctionProps} from "digitraffic-common/stack/lambda-configs";
import {DigitrafficRestApi} from "digitraffic-common/api/rest_apis";
import {createUsagePlan} from "digitraffic-common/stack/usage-plans";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {TrafficType} from "digitraffic-common/model/traffictype";
import {ISecret} from "@aws-cdk/aws-secretsmanager";

export function create(stack: DigitrafficStack, secret: ISecret) {
    const integrationApi = new DigitrafficRestApi(stack, 'VariableSigns-Integration', 'Variable Signs integration API');
    createUpdateRequestHandler(stack, integrationApi, secret);
    createUsagePlan(integrationApi, 'Integration API key', 'Integration Usage Plan');
}

function createUpdateRequestHandler (
    stack: DigitrafficStack,
    integrationApi: RestApi,
    secret: ISecret) {
    const updateDatexV1Handler = createUpdateDatexV1(stack, secret);

    const integrationV1Root = createIntegrationV1Root(integrationApi);

    createOldPathResource(integrationApi, updateDatexV1Handler);
    createIntegrationResource(integrationV1Root, updateDatexV1Handler);
}

function createIntegrationV1Root(integrationApi: RestApi) {
    const vsResource = integrationApi.root.addResource("variable-signs");

    return vsResource.addResource("v1");
}


function createIntegrationResource(intergrationRoot: Resource, updateDatexV1Handler: Function) {
    const updateDatex2Resource = intergrationRoot.addResource("update-datex2");

    updateDatex2Resource.addMethod("PUT", new LambdaIntegration(updateDatexV1Handler), {
        apiKeyRequired: true
    });
}

function createOldPathResource(integrationApi: RestApi, updateDatexV1Handler: Function) {
    const apiResource = integrationApi.root.addResource("api");
    const integrationResource = apiResource.addResource("integration");
    const vsResource = integrationResource.addResource("variable-signs");
    const datex2Resource = vsResource.addResource("datex2");

    datex2Resource.addMethod("PUT", new LambdaIntegration(updateDatexV1Handler), {
        apiKeyRequired: true
    });
}

function createUpdateDatexV1(stack: DigitrafficStack, secret: ISecret): Function {
    const updateDatex2Id = 'VS-UpdateDatex2';
    const environment = stack.createDefaultLambdaEnvironment('VS');
    const updateDatex2Handler = MonitoredFunction.create(stack, updateDatex2Id, dbFunctionProps(stack, {
        functionName: updateDatex2Id,
        memorySize: 256,
        environment,
        code: new AssetCode('dist/lambda/update-datex2'),
        handler: 'lambda-update-datex2.handler'
    }), TrafficType.ROAD);

    secret.grantRead(updateDatex2Handler);

    createSubscription(updateDatex2Handler, updateDatex2Id, stack.configuration.logsDestinationArn, stack);

    return updateDatex2Handler;
}
