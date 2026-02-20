import * as util from "node:util";
import { Sha256 } from "@aws-crypto/sha256-browser";
import type { AwsCredentialIdentity } from "@aws-sdk/types";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { HttpRequest } from "@smithy/protocol-http";
import { SignatureV4 } from "@smithy/signature-v4";
import type { OSMonitor } from "../monitor/monitor.js";
import { opensearchMonitor } from "../monitor/monitor.js";

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
    monitorName: string | undefined = undefined,
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
      logger.debug(`RESPONSE: ${util.inspect(response, { depth: null })}`);
      logger.error({
        method: "OpenSearch.send",
        customUrl: path,
        customHttpMethod: method,
        customStatusCode: response.statusCode,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        customStatusMessage: response.body.statusMessage,
        customMonitorName: monitorName,
        customBody: body,
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

  async deleteMonitor(
    monitor: MonitorNameAndId,
  ): Promise<OSMonitorsResponse | undefined> {
    const queryUrl = `${OS_MONITORS_URL_PATH}${monitor.id}`;

    return this.send("DELETE", queryUrl, undefined, monitor.name);
  }

  addMonitor(monitor: OSMonitor): Promise<OSMonitorsResponse | undefined> {
    logger.debug(`Sending ${monitor.name}`);

    return this.send(
      "POST",
      OS_MONITORS_URL_PATH,
      JSON.stringify(opensearchMonitor(monitor)),
      monitor.name,
    );
  }

  async deleteAllMonitors(): Promise<void> {
    const monitors = await this.getAllMonitors();

    logger.info({
      method: "OpenSearch.deleteAllMonitors",
      customCount: monitors.length,
    });

    await Promise.allSettled(
      monitors.map(async (monitor) => this.deleteMonitor(monitor)),
    );
  }

  async addMonitors(monitors: OSMonitor[]): Promise<void> {
    logger.info({
      method: "OpenSearch.addMonitors",
      message: "Start",
      customCount: monitors.length,
    });

    await Promise.allSettled(
      monitors.map(async (monitor) => {
        try {
          const response = await this.addMonitor(monitor);
          logger.info({
            method: "OpenSearch.addMonitors",
            message: "Added monitor",
            customName: monitor.name,
          });
          return response;
        } catch (error) {
          logger.error({
            method: "OpenSearch.addMonitors",
            message: "Failed to add monitor",
            customName: monitor.name,
            error,
          });
          throw error;
        }
      }),
    );
  }

  async checkMonitorsUptodate(expectedMonitors: OSMonitor[]): Promise<void> {
    const currentMonitors = await this.getAllMonitors();
    // Build a Set of names from currentMonitors
    const currentNames = new Set(currentMonitors.map((m) => m.name));
    const expectedNames = new Set(expectedMonitors.map((m) => m.name));

    // Find monitors that are missing in monitorsAfterUpdate
    // Check for monitors that are in currentMap but missing in updatedMap
    const unexpectedMonitors = [...currentNames.keys()].filter(
      (name) => !expectedNames.has(name),
    );

    const missingMonitors = [...expectedNames.keys()].filter(
      (name) => !currentNames.has(name),
    );

    if (missingMonitors.length > 0) {
      logger.error({
        method: "UpdateOsMonitors.checkMonitorsUptodate",
        message: "Missing monitors",
        customMissingMonitors: missingMonitors.join(", "),
      });
      throw new Error(
        `UpdateOsMonitors.checkMonitorsUptodate failed. Missing monitors ${missingMonitors.join(
          ", ",
        )}`,
      );
    } else {
      logger.info({
        method: "UpdateOsMonitors.checkMonitorsUptodate",
        message: "All monitors are present",
        customCount: expectedMonitors.length,
      });
    }

    if (unexpectedMonitors.length > 0) {
      logger.error({
        method: "UpdateOsMonitors.checkMonitorsUptodate",
        message: "Unexpected monitors found:",
        customNotExpectedMonitors: unexpectedMonitors.join(", "),
      });
      throw new Error(
        `UpdateOsMonitors.checkMonitorsUptodate failed. Unexpected monitors found: ${unexpectedMonitors.join(
          ", ",
        )}`,
      );
    } else {
      logger.debug({ message: "No unexpected monitors are present" });
    }
  }
}
