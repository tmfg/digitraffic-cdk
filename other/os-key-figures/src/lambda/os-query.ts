import "source-map-support/register";
import { retryRequest } from "@digitraffic/common/dist/utils/retry";
import { HttpError } from "@digitraffic/common/dist/types/http-error";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { HttpRequest, HttpResponse } from "@smithy/protocol-http";
import { Sha256 } from "@aws-crypto/sha256-browser";
import { SignatureV4 } from "@smithy/signature-v4";
import type { AwsCredentialIdentity } from "@aws-sdk/types";
import { NodeHttpHandler } from "@smithy/node-http-handler";

function handleResponseFromOs(
    response: HttpResponse,
    successCallback: (result: Record<string, unknown>) => void,
    failedCallback: (code: number, message: string) => void
) {
    const statusCode = response.statusCode;
    logger.info({
        message: `OpenSearch responded with status code ${statusCode}`,
        method: "os-query.handleResponseFromEs"
    });
    if (statusCode && (statusCode < 200 || statusCode >= 300)) {
        failedCallback(
            statusCode,
            `OpenSearch responded with status code ${statusCode}. The error message was: ${response.reason}`
        );
        return;
    }
    let responseBody = "";
    response.body.on("data", function (chunk: string) {
        responseBody += chunk;
    });
    response.body.on("end", function () {
        try {
            successCallback(JSON.parse(responseBody));
        } catch (e) {
            logger.info({
                message: `Failed to parse response body: ${responseBody}`,
                method: "os-query.handleResponseFromEs"
            });
        }
    });
}

async function signOsRequest(request: HttpRequest, credentials: AwsCredentialIdentity) {
    const signer = new SignatureV4({
        credentials,
        region: "eu-west-1",
        service: "es",
        sha256: Sha256
    });

    const signedRequest = (await signer.sign(request)) as HttpRequest;
    return signedRequest;
}

function createRequestForOs(
    vpcEndpoint: string,
    osEndpoint: string,
    query: string,
    path: string
): HttpRequest {
    const index = "ft-digitraffic-access*";

    const request = new HttpRequest({
        method: "POST",
        path: `/${index}/${path}`,
        protocol: "https",
        body: query,
        hostname: vpcEndpoint,
        headers: {
            "Content-Type": "application/json",
            host: osEndpoint
        }
    });
    return request;
}

export async function fetchDataFromOs(
    vpcEndpoint: string,
    osEndpoint: string,
    query: string,
    path: string,
    credentials: AwsCredentialIdentity
): Promise<any> {
    const request = createRequestForOs(vpcEndpoint, osEndpoint, query, path);

    const signedRequest = await signOsRequest(request, credentials);

    const client = new NodeHttpHandler();

    const makeRequest = async (): Promise<Record<string, unknown>> => {
        return new Promise(async (resolve, reject) => {
            const { response } = await client.handle(signedRequest);
            handleResponseFromOs(
                response,
                (result) => {
                    resolve(result);
                },
                (code, message) => {
                    reject(new HttpError(code, message));
                }
            );
        });
    };

    try {
        return await retryRequest(makeRequest);
    } catch (error: unknown) {
        logger.error({
            message: `Request failed: ${error instanceof Error && error.message}`,
            method: "os-query.fetchDataFromOs"
        });
        throw error;
    }
}
