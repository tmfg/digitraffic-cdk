import {APIGateway} from "aws-sdk";

export async function getApiKeyFromAPIGateway(keyId: string): Promise<APIGateway.Types.ApiKey> {
    const agw = new APIGateway();
    return agw.getApiKey({
        apiKey: keyId,
        includeValue: true
    }).promise();
}
