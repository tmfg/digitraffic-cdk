import "source-map-support/register";
import * as AWSx from "aws-sdk";
import type { IncomingMessage } from "http";

const AWS = AWSx as any;

const region = "eu-west-1";

class HttpError extends Error {
    statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
    }
}

const retryStatusCodes = new Set([
    // 403 näyttää tulevan aina sillon tällön ilman mitään ilmeistä syytä
    403,
    // Opensearch ainakin huutaa 429, jos tekee liian monta kyselyä liian nopeasti
    429
]);

function isLastRetry(retryCount: number) {
    return retryCount > 5;
}

// Tämä muuttuja on testejä varten määritelty täällä.
export let retryCount = 0;
export async function retryRequest<T>(request: () => Promise<T>): Promise<T> {
    retryCount = 0;
    while (!isLastRetry(retryCount)) {
        try {
            return await request();
        } catch (error) {
            if (isLastRetry(retryCount)) {
                throw error;
            }
            if (error instanceof HttpError) {
                if (retryStatusCodes.has(error.statusCode)) {
                    retryCount++;
                    const seconds = 2 ** retryCount;
                    console.info(
                        `Retrying request in ${seconds} seconds due to status code ${error.statusCode} (retry count: ${retryCount})`
                    );
                    await new Promise((resolve) => setTimeout(resolve, 1000 * seconds));
                }
            } else {
                throw error;
            }
        }
    }
}

function handleResponseFromEs(
    successCallback: (result: Record<string, unknown>) => void,
    failedCallback: (code: number, message: string) => void
) {
    return (httpResp: IncomingMessage) => {
        const statusCode = httpResp.statusCode;
        console.log(`OpenSearch responded with status code ${statusCode}`);
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
                console.log(`Failed to parse response body: ${respBody}`);
            }
        });
    };
}

function addCredentialsToEsRequest(req: AWS.HttpRequest) {
    const creds = new AWS.EnvironmentCredentials("AWS");
    const signer = new AWS.Signers.V4(req, "es");
    signer.addAuthorization(creds, new Date());
}

function createRequestForEs(endpoint: AWS.Endpoint, query: string, path: string) {
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
    client.handleRequest(req, null, callback, function (err: any) {
        console.error("Error: " + err);
    });
}

export async function fetchDataFromEs(endpoint: AWS.Endpoint, query: string, path: string): Promise<any> {
    const req = createRequestForEs(endpoint, query, path);

    addCredentialsToEsRequest(req);

    const client = new AWS.NodeHttpClient();

    const makeRequest = async (): Promise<Record<string, unknown>> => {
        return new Promise((resolve, reject) => {
            const callback = handleResponseFromEs(
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
    } catch (error) {
        console.error(`Request failed: ${error}`);
        throw error;
    }
}
