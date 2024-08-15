import "source-map-support/register";
import * as AWSx from "aws-sdk";
import { retryRequest } from "@digitraffic/common/dist/utils/retry";
import { HttpError } from "@digitraffic/common/dist/types/http-error";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { IncomingMessage } from "http";

const AWS = AWSx as any;

const region = "eu-west-1";

function handleResponseFromOs(
    successCallback: (result: Record<string, unknown>) => void,
    failedCallback: (code: number, message: string) => void
) {
    return (httpResp: IncomingMessage) => {
        const statusCode = httpResp.statusCode;
        logger.info({
            message: `OpenSearch responded with status code ${statusCode}`,
            method: "os-query.handleResponseFromEs"
        });
        if (statusCode < 200 || statusCode >= 300) {
            failedCallback(
                statusCode,
                `OpenSearch responded with status code ${httpResp.statusCode}. The error message was: ${httpResp.statusMessage}`
            );
            return;
        }
        let respBody = "";
        httpResp.on("data", function (chunk: any) {
            respBody += chunk;
        });
        httpResp.on("end", function (chunk: any) {
            try {
                successCallback(JSON.parse(respBody));
            } catch (e) {
                logger.info({
                    message: `Failed to parse response body: ${respBody}`,
                    method: "os-query.handleResponseFromEs"
                });
            }
        });
    };
}

function addCredentialsToOsRequest(req: AWSx.HttpRequest) {
    const creds = new AWS.EnvironmentCredentials("AWS");
    const signer = new AWS.Signers.V4(req, "es");
    signer.addAuthorization(creds, new Date());
}

function createRequestForOs(endpoint: AWSx.Endpoint, query: string, path: string) {
    const req = new AWS.HttpRequest(endpoint);
    const index = "dt-nginx-*";

    req.method = "POST";
    req.path = `/${index}/${path}`;
    req.region = region;
    req.headers.Host = endpoint.host;
    req.headers["Content-Type"] = "application/json";
    req.body = query;

    return req;
}

function handleRequest(client, req, callback) {
    client.handleRequest(req, null, callback, function (err: Error) {
        logger.error({
            message: "Error: " + err.message,
            method: "os-query.handleRequest"
        });
    });
}

export async function fetchDataFromOs(endpoint: AWSx.Endpoint, query: string, path: string): Promise<any> {
    const req = createRequestForOs(endpoint, query, path);

    addCredentialsToOsRequest(req);

    const client = new AWS.NodeHttpClient();

    const makeRequest = async (): Promise<Record<string, unknown>> => {
        return new Promise((resolve, reject) => {
            const callback = handleResponseFromOs(
                (result) => {
                    resolve(result);
                },
                (code, message) => {
                    reject(new HttpError(code, message));
                }
            );
            handleRequest(client, req, callback);
        });
    };
    try {
        return await retryRequest(makeRequest);
    } catch (error: unknown) {
        logger.error({
            message: `Request failed: ${error instanceof Error && error.message}`,
            method: "es-query.fetchDataFromEs"
        });
        throw error;
    }
}
