import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import type { APIGatewayProxyEventSubset } from "@digitraffic/common/dist/aws/types/lambda-proxy-types";
import type { APIGatewayProxyResult } from "aws-lambda";
import ky from "ky";

interface VoyagePlanSecret extends GenericSecret {
  readonly "vpgw.schedulesAccessToken": string;
  readonly "vpgw.schedulesUrl": string;
}

const secretHolder = SecretHolder.create<VoyagePlanSecret>();

export function handler(
  event: APIGatewayProxyEventSubset,
): Promise<APIGatewayProxyResult> {
  return secretHolder.get().then(async (secret: VoyagePlanSecret) => {
    if (
      // biome-ignore lint/complexity/useLiteralKeys: comes from indexed access
      event.queryStringParameters?.["auth"] !==
      secret["vpgw.schedulesAccessToken"]
    ) {
      return {
        statusCode: 403,
        body: "Denied",
      };
    }

    let url = secret["vpgw.schedulesUrl"];
    // biome-ignore lint/complexity/useLiteralKeys: comes from indexed access
    if (event.queryStringParameters["direction"]) {
      // biome-ignore lint/complexity/useLiteralKeys: comes from indexed access
      if (["east", "west"].includes(event.queryStringParameters["direction"])) {
        // biome-ignore lint/complexity/useLiteralKeys: comes from indexed access
        url += `/${event.queryStringParameters["direction"]}`;
      } else {
        return {
          statusCode: 400,
          body: "Unknown direction",
        };
      }
    }

    // biome-ignore lint/complexity/useLiteralKeys: comes from indexed access
    const calculated = event.queryStringParameters["calculated"] === "true";
    if (calculated) {
      url += "/calculated";
    }

    const params: string[] = [];
    handleQueryParam("name", event.queryStringParameters, params);
    handleQueryParam("callsign", event.queryStringParameters, params);
    handleQueryParam("imo", event.queryStringParameters, params);
    handleQueryParam("mmsi", event.queryStringParameters, params);
    handleQueryParam("uuid", event.queryStringParameters, params);
    handleQueryParam("locode", event.queryStringParameters, params);
    handleQueryParam("externalID", event.queryStringParameters, params);

    const fullUrl = url + (params.length ? "?" : "") + params.join("&");
    const body = await ky.get<string>(fullUrl).text();
    return {
      statusCode: 200,
      body,
    };
  });
}

function handleQueryParam(
  param: string,
  queryParams: Record<string, string | undefined>,
  params: string[],
): void {
  if (queryParams[param] !== undefined) {
    params.push(`${param}=${queryParams[param]}`);
  }
}
