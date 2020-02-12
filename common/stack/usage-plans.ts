import {RestApi} from '@aws-cdk/aws-apigateway';

export function createUsagePlan(api: RestApi, apiKeyId: string, apiKeyName: string) {
    const apiKey = api.addApiKey(apiKeyId);
    const plan = api.addUsagePlan(apiKeyName, {
        name: apiKeyName,
        apiKey
    });
    plan.addApiStage({
        stage: api.deploymentStage
    });
}
