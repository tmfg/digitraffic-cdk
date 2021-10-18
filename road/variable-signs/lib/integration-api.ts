import {LambdaIntegration, Resource, RestApi} from '@aws-cdk/aws-apigateway';
import {Function} from '@aws-cdk/aws-lambda';
import {DigitrafficLogSubscriptions} from "digitraffic-common/stack/subscription";
import {databaseFunctionProps} from "digitraffic-common/stack/lambda-configs";
import {DigitrafficRestApi} from "digitraffic-common/api/rest_apis";
import {createUsagePlan} from "digitraffic-common/stack/usage-plans";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
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

function createUpdateDatexV1(stack: DigitrafficStack, secret: ISecret): Function {
    const functionName = 'VS-UpdateDatex2';
    const environment = stack.createDefaultLambdaEnvironment('VS');
    const updateDatex2Handler = MonitoredFunction.create(stack, functionName, databaseFunctionProps(stack, environment, functionName, 'update-datex2', {
        memorySize: 256,
    }));

    secret.grantRead(updateDatex2Handler);

    new DigitrafficLogSubscriptions(stack, updateDatex2Handler);

    return updateDatex2Handler;
}
