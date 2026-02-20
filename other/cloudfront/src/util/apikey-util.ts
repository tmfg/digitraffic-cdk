import { APIGateway } from "@aws-sdk/client-api-gateway";
import { SSM } from "@aws-sdk/client-ssm";

export interface EndpointMetadata {
  readonly endpointUrl: string;
  readonly apiKey: string;
}

const ssm = new SSM({
  region: "eu-west-1",
});

const apiGateway = new APIGateway({
  region: "eu-west-1",
});

async function getParameterValue(name: string): Promise<string> {
  const response = await ssm.getParameter({ Name: name });

  // biome-ignore lint/style/noNonNullAssertion: it should be set
  return response.Parameter?.Value!;
}

export async function readApiKey(shortName: string): Promise<EndpointMetadata> {
  // parameter is a full url as in https://api-gateway-address/stage/
  const endpoint = new URL(
    await getParameterValue(`/digitraffic/${shortName}/endpointUrl`),
  );
  const apiKeyId = await getParameterValue(
    `/digitraffic/${shortName}/apiKeyId`,
  );

  const apiKey = await getApiKeyFromAPIGateway(apiKeyId);
  const endpointUrl = endpoint.host;

  return {
    endpointUrl,
    apiKey,
  };
}

export async function getApiKeyFromAPIGateway(apiKey: string): Promise<string> {
  const response = await apiGateway.getApiKey({
    apiKey,
    includeValue: true,
  });

  if (!response.value) {
    throw new Error(`Could not find apikey ${apiKey}`);
  }

  return response.value;
}
