const AWS = require('aws-sdk');

export async function getApiKeyFromAPIGateway(keyId: string): Promise<any> {
    const agw = new AWS.APIGateway();
    return agw.getApiKey({
        apiKey: keyId,
        includeValue: true
    }).promise();
}
