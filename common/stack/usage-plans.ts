import {RestApi} from '@aws-cdk/aws-apigateway';

/**
 * Creates an usage plan for a REST API with a single API key
 * @param api The REST API
 * @param apiKeyId Id for the API key, this is a surrogate id for CDK, not displayed anywhere
 * @param apiKeyName Name for the API key, this is displayed in the AWS Console
 */
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
