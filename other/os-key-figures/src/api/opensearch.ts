import { Sha256 } from "@aws-crypto/sha256-browser";
import type { AwsCredentialIdentity } from "@aws-sdk/types";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { HttpError } from "@digitraffic/common/dist/types/http-error";
import { retryRequest } from "@digitraffic/common/dist/utils/retry";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { HttpRequest, HttpResponse } from "@smithy/protocol-http";
import { SignatureV4 } from "@smithy/signature-v4";

export enum OpenSearchApiMethod {
  COUNT = "_count",
  SEARCH = "_search",
}

type OpenSearchApiMethodAndParams =
  | `${OpenSearchApiMethod}`
  | `${OpenSearchApiMethod}?${string}`;

export class OpenSearch {
  private readonly actualHost: string;
  private readonly endpointHost: string;
  private readonly credentials: AwsCredentialIdentity;

  constructor(
    actualHost: string,
    endpointHost: string,
    credentials: AwsCredentialIdentity,
  ) {
    this.actualHost = actualHost;
    this.endpointHost = endpointHost;
    this.credentials = credentials;
  }

  async makeOsQuery(
    index: string,
    method: OpenSearchApiMethodAndParams,
    query: string,
  ): Promise<any> {
    const request = new HttpRequest({
      method: "POST",
      path: `/${index}/${method}`,
      protocol: "https",
      body: query,
      hostname: this.endpointHost,
      headers: {
        "Content-Type": "application/json",
        host: this.actualHost,
      },
    });

    const signedRequest = await this.signOsRequest(request, this.credentials);

    const client = new NodeHttpHandler();

    const makeRequest = async (): Promise<Record<string, unknown>> => {
      return new Promise(async (resolve, reject) => {
        const { response } = await client.handle(signedRequest);
        this.handleResponseFromOs(
          response,
          (result) => {
            resolve(result);
          },
          (code, message) => {
            reject(new HttpError(code, message));
          },
        );
      });
    };

    try {
      return await retryRequest(makeRequest);
    } catch (error: unknown) {
      logger.error({
        message: `Request failed: ${error instanceof Error && error.message}`,
        method: "os-query.fetchDataFromOs",
      });
      throw error;
    }
  }

  handleResponseFromOs(
    response: HttpResponse,
    successCallback: (result: Record<string, unknown>) => void,
    failedCallback: (code: number, message: string) => void,
  ) {
    const statusCode = response.statusCode;
    logger.info({
      message: `OpenSearch responded with status code ${statusCode}`,
      method: "os-query.handleResponseFromOs",
    });
    if (statusCode && (statusCode < 200 || statusCode >= 300)) {
      failedCallback(
        statusCode,
        `OpenSearch responded with status code ${statusCode}. The error message was: ${response.reason}`,
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
          method: "os-query.handleResponseFromOs",
        });
      }
    });
  }

  async signOsRequest(
    request: HttpRequest,
    credentials: AwsCredentialIdentity,
  ) {
    const signer = new SignatureV4({
      credentials,
      region: "eu-west-1",
      service: "es",
      sha256: Sha256,
    });
    const signedRequest = (await signer.sign(request)) as HttpRequest;
    return signedRequest;
  }
}
