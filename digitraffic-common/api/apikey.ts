const AWS = require('aws-sdk');

export async function getApiKeyFromAPIGateway(keyId: string) {
    try {
        const agw = new AWS.APIGateway();
        return agw.getApiKey({
            apiKey: keyId,
            includeValue: true
        }).promise();
    } catch (e) {
        console.info("failed " + e);
    }
}
