import {RestApi,Resource}  from '@aws-cdk/aws-apigateway';
import {Function, AssetCode} from '@aws-cdk/aws-lambda';
import {LambdaIntegration} from "@aws-cdk/aws-apigateway";
import {Construct} from "@aws-cdk/core";
import {IVpc, ISecurityGroup} from '@aws-cdk/aws-ec2';
import {createSubscription} from "../../../common/stack/subscription";
import {LambdaConfiguration} from "../../../common/stack/lambda-configs";
import {dbLambdaConfiguration} from '../../../common/stack/lambda-configs';
import {createRestApi} from "../../../common/api/rest_apis";

export function create(vpc: IVpc, lambdaDbSg: ISecurityGroup, props: LambdaConfiguration, stack: Construct) {
    const integrationApi = createRestApi(stack, 'VariableSigns-Integration', 'Variable Signs integration API', props.allowFromIpAddresses);
    createUpdateRequestHandler(stack, integrationApi, vpc, lambdaDbSg, props);
    createUsagePlan(integrationApi);
}

function createUpdateRequestHandler(
    stack: Construct,
    integrationApi: RestApi,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: LambdaConfiguration) {

    const apiResource = integrationApi.root.addResource("api");
    const integrationResource = apiResource.addResource("integration");
    const vsResource = integrationResource.addResource("variable-signs");
    const datex2Resource = vsResource.addResource("datex2");

    createUpdateDatex2RequestHandler(datex2Resource, stack, vpc, lambdaDbSg, props);
}

function createUpdateDatex2RequestHandler(
    requests: Resource,
    stack: Construct,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: LambdaConfiguration
) {
    const updateDatex2Id = 'VS-UpdateDatex2';
    const updateDatex2Handler = new Function(stack, updateDatex2Id, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: updateDatex2Id,
        code: new AssetCode('dist/lambda/update-datex2'),
        handler: 'lambda-update-datex2.handler'
    }));
    requests.addMethod("PUT", new LambdaIntegration(updateDatex2Handler), {
        apiKeyRequired: true
    });

    createSubscription(updateDatex2Handler, updateDatex2Id, props.logsDestinationArn, stack);
}

function createUsagePlan(integrationApi: RestApi) {
    const apiKey = integrationApi.addApiKey('Integration API key');
    const plan = integrationApi.addUsagePlan('Integration Usage Plan', {
        name: 'Integration Usage Plan',
        apiKey
    });
    plan.addApiStage({
        stage: integrationApi.deploymentStage
    });
}
