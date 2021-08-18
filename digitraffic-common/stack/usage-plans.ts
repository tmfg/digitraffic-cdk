import {RestApi} from '@aws-cdk/aws-apigateway';

/**
 * TODO FIXME creates funny names for the api keys ie. Maintenance Tracking API Key will be Main-Main-RANDOMSTRING
 * Fix fill affect already used keys.
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

/**
 * Creates a default usage plan for a REST API with a single API key
 * @param api The REST API
 * @param apiName Name of the api. Will generate key: apiName + ' API Key' and plan: apiName + ' API Usage Plan'
 */
export function createDefaultUsagePlan(api: RestApi, apiName: string) {
    const apiKeyName = apiName + ' API Key'
    const usagePlanName = apiName + ' API Usage Plan'
    const apiKey = api.addApiKey(apiKeyName, { apiKeyName: apiKeyName });
    const plan = api.addUsagePlan(usagePlanName, {
        name: usagePlanName,
        apiKey
    });
    plan.addApiStage({
        stage: api.deploymentStage
    });
}
