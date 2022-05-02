import {IApiKey, RestApi} from 'aws-cdk-lib/aws-apigateway';

/**
 * Creates an usage plan for a REST API with a single API key
 * @param api The REST API
 * @param apiKeyId Id for the API key, this is a surrogate id for CDK, not displayed anywhere
 * @param apiKeyName Name for the API key, this is displayed in the AWS Console
 * @deprecated Creates randomized API key names, use createDefaultUsagePlan instead
 */
export function createUsagePlan(api: RestApi, apiKeyId: string, apiKeyName: string): IApiKey {
    const apiKey = api.addApiKey(apiKeyId);
    const plan = api.addUsagePlan(apiKeyName, {
        name: apiKeyName,
    });
    plan.addApiStage({
        stage: api.deploymentStage,
    });
    plan.addApiKey(apiKey);

    return apiKey;
}

/**
 * Creates a default usage plan for a REST API with a single API key
 * @param api The REST API
 * @param apiName Name of the api. Will generate key: apiName + ' API Key' and plan: apiName + ' API Usage Plan'
 */
export function createDefaultUsagePlan(api: RestApi, apiName: string) {
    const apiKeyName = apiName + ' API Key';
    const usagePlanName = apiName + ' API Usage Plan';
    const apiKey = api.addApiKey(apiKeyName, { apiKeyName: apiKeyName });
    const plan = api.addUsagePlan(usagePlanName, {
        name: usagePlanName,
    });
    plan.addApiStage({
        stage: api.deploymentStage,
    });
    plan.addApiKey(apiKey);
}
