export function getModelReference(modelId: string, restApiId: string) {
    return `https://apigateway.amazonaws.com/restapis/${restApiId}/models/${modelId}`;
}