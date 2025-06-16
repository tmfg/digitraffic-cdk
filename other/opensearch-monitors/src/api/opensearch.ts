import { HttpRequest } from "@smithy/protocol-http";
import { SignatureV4 } from "@smithy/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-browser";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import type { AwsCredentialIdentity } from "@aws-sdk/types";
import { opensearchMonitor, type OSMonitor } from "../monitor/monitor.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";

export interface OSResponse {
  readonly result: string;
  readonly _shards: {
    total: number;
    successful: number;
    skipped: number;
    failed: number;
  };
}

export interface OSMonitorsResponse extends OSResponse {
  readonly hits: {
    hits: {
      _id: string;
      _source: {
        name: string;
      };
    }[];
  };
}

interface MonitorNameAndId {
  readonly name: string;
  readonly id: string;
}

type HttpMethod = "POST" | "DELETE";

const OS_MONITORS_URL_PATH = "/_plugins/_alerting/monitors/";
const OS_SEARCH_MONITORS_PATH = `${OS_MONITORS_URL_PATH}_search`;

const OS_MONITORS_SEACH = JSON.stringify({
  size: 200,
  query: {
    exists: {
      field: "monitor",
    },
  },
});

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

  async send(
    method: HttpMethod,
    path: string,
    body: string | undefined = undefined,
  ): Promise<OSMonitorsResponse | undefined> {
    const request = new HttpRequest({
      body,
      protocol: "https",
      headers: {
        "Content-Type": "application/json",
        host: this.actualHost,
      },
      hostname: this.endpointHost,
      method,
      path,
    });

    //        console.info("sending request " + JSON.stringify(request));

    const signer = new SignatureV4({
      credentials: this.credentials,
      region: "eu-west-1",
      service: "es",
      sha256: Sha256,
    });

    const signedRequest = (await signer.sign(request)) as HttpRequest;
    const client = new NodeHttpHandler();

    const { response } = await client.handle(signedRequest);

    // 200 from delete, 201 from create
    if (response.statusCode > 201) {
      logger.debug(JSON.stringify(response));

      logger.error({
        method: "OpenSearch.send",
        customUrl: path,
        customHttpMethod: method,
        customStatusCode: response.statusCode,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        customStatusMessage: response.body.statusMessage,
      });
    }

    let responseBody = "";
    await new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      response.body.on("data", (chunk: string) => {
        responseBody += chunk;
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      response.body.on("end", () => {
        resolve(responseBody);
      });
    }).catch((error) => {
      logException(logger, error);

      return undefined;
    });

    return JSON.parse(responseBody) as OSMonitorsResponse;
  }

  async getAllMonitors(): Promise<MonitorNameAndId[]> {
    const osResponse = await this.send(
      "POST",
      OS_SEARCH_MONITORS_PATH,
      OS_MONITORS_SEACH,
    );

    return osResponse
      ? osResponse.hits.hits.map((h) => ({
        name: h._source.name,
        id: h._id,
      }))
      : [];
  }

  async deleteMonitor(id: string): Promise<OSMonitorsResponse | undefined> {
    const queryUrl = `${OS_MONITORS_URL_PATH}${id}`;

    return this.send("DELETE", queryUrl);
  }

  addMonitor(monitor: OSMonitor): Promise<OSMonitorsResponse | undefined> {
    logger.debug("Sending " + monitor.name);

    return this.send(
      "POST",
      OS_MONITORS_URL_PATH,
      JSON.stringify(opensearchMonitor(monitor)),
    );
  }

  async deleteAllMonitors(): Promise<void> {
    const monitors = await this.getAllMonitors();

    logger.info({
      method: "OpenSearch.deleteAllMonitors",
      customCount: monitors.length,
    });

    await Promise.allSettled(
      monitors.map(async (monitor) => this.deleteMonitor(monitor.id)),
    );
  }

  async addMonitors(monitors: OSMonitor[]): Promise<void> {
    logger.info({
      method: "OpenSearch.addMonitors",
      customCount: monitors.length,
    });

    await Promise.allSettled(
      monitors.map(async (monitor) => this.addMonitor(monitor)),
    );
  }
}
