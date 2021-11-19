import {LambdaIntegration, Resource, RestApi} from '@aws-cdk/aws-apigateway';
import {Function} from '@aws-cdk/aws-lambda';
import {DigitrafficLogSubscriptions} from "digitraffic-common/stack/subscription";
import {DigitrafficRestApi} from "digitraffic-common/api/rest_apis";
import {createUsagePlan} from "digitraffic-common/stack/usage-plans";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {MonitoredDBFunction, MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";

export function create(stack: DigitrafficStack) {
    const integrationApi = new DigitrafficRestApi(stack, 'VariableSigns-Integration', 'Variable Signs integration API');
    createUpdateRequestHandler(stack, integrationApi);
    createUsagePlan(integrationApi, 'Integration API key', 'Integration Usage Plan');
}

function createUpdateRequestHandler (
    stack: DigitrafficStack,
    integrationApi: RestApi) {
    const updateDatexV1Handler = createUpdateDatexV1(stack);
    const integrationV1Root = createIntegrationV1Root(integrationApi);

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

function createUpdateDatexV1(stack: DigitrafficStack): Function {
    return MonitoredDBFunction.create(stack, 'update-datex2', undefined, {
        memorySize: 256
    });
}
