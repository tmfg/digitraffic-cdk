//import { APIGatewayClient, GetApiKeyCommand } from "@aws-sdk/client-api-gateway";
//import type { GetApiKeyCommandOutput } from "@aws-sdk/client-api-gateway";

import { APIGateway } from "aws-sdk";
import type { ApiKey } from "aws-sdk/clients/apigateway.js";

export async function getApiKeyFromAPIGateway(
    keyId: string
): Promise<ApiKey> {
    const ag = new APIGateway();

    return ag.getApiKey({
        apiKey: keyId,
        includeValue: true
    }).promise();
    /*
    const client = new APIGatewayClient();
    const command = new GetApiKeyCommand({
        apiKey: keyId,
        includeValue: true,
    });

    return client.send(command);*/
}
