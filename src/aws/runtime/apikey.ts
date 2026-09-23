import type { GetApiKeyCommandOutput } from "@aws-sdk/client-api-gateway";
import {
  APIGatewayClient,
  GetApiKeyCommand,
} from "@aws-sdk/client-api-gateway";
import { FetchHttpHandler } from "@smithy/fetch-http-handler";

export async function getApiKeyFromAPIGateway(
  keyId: string,
): Promise<GetApiKeyCommandOutput> {
  const client = new APIGatewayClient({
    requestHandler: new FetchHttpHandler(),
  });
  const command = new GetApiKeyCommand({
    apiKey: keyId,
    includeValue: true,
  });

  return await client.send(command);
}
