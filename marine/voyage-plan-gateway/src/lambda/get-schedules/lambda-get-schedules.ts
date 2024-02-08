import axios from "axios";
import type { ProxyLambdaRequest, ProxyLambdaResponse } from "@digitraffic/common/dist/aws/types/proxytypes";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";

interface VoyagePlanSecret extends GenericSecret {
    readonly "vpgw.schedulesAccessToken": string;
    readonly "vpgw.schedulesUrl": string;
}

const secretHolder = SecretHolder.create<VoyagePlanSecret>();

export function handler(event: ProxyLambdaRequest): Promise<ProxyLambdaResponse> {
    return secretHolder.get().then(async (secret: VoyagePlanSecret) => {
        // eslint-disable-next-line dot-notation
        if (event.queryStringParameters["auth"] !== secret["vpgw.schedulesAccessToken"]) {
            return {
                statusCode: 403,
                body: "Denied"
            };
        }

        let url = secret["vpgw.schedulesUrl"];
        // eslint-disable-next-line dot-notation
        if (event.queryStringParameters["direction"]) {
            // eslint-disable-next-line dot-notation
            if (["east", "west"].includes(event.queryStringParameters["direction"])) {
                // eslint-disable-next-line dot-notation
                url += "/" + event.queryStringParameters["direction"];
            } else {
                return {
                    statusCode: 400,
                    body: "Unknown direction"
                };
            }
        }

        // eslint-disable-next-line dot-notation
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
        const resp = await axios.get<string>(fullUrl);
        return {
            statusCode: 200,
            body: resp.data
        };
    });
}

function handleQueryParam(param: string, queryParams: Record<string, string>, params: string[]): void {
    if (queryParams[param]) {
        params.push(`${param}=${queryParams[param]}`);
    }
}
