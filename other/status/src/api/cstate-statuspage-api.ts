import type { LoggerMethodType } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import type { TrafficType } from "@digitraffic/common/dist/types/traffictype";
import { add, isBefore, parseJSON } from "date-fns";
import ky, { HTTPError } from "ky";
import type { UpdateStatusSecret } from "../secret.js";

const STATUS_JSON_PATH = "/index.json" as const;
const MAINTENANCE_ISSUE_PATH = "/digitraffic-maintenance/" as const;

const SERVICE = "CStateStatuspageApi" as const;

export interface CStateSystem extends Record<string, unknown> {
  readonly name: string; // "marine/api/ais/v1/locations",
  readonly description: string; // "Find latest vessel locations by mmsi and optional timestamp interval in milliseconds from Unix epoch.",
  readonly category: TrafficType;
  readonly status: "ok" | "notice" | "disrupted" | "down";
}

export interface CStateStatus extends Record<string, unknown> {
  readonly baseURL: string;
  readonly pinnedIssues: PinnedIssue[];
  readonly systems: CStateSystem[];
}

export interface PinnedIssue {
  readonly is: string;
  readonly title: string;
  readonly createdAt: string;
  readonly lastMod: string;
  readonly permalink: string;
  readonly affected: string[];
  readonly filename: string;
}

export interface ActiveMaintenance {
  readonly issue: PinnedIssue;
  readonly baseURL: string;
}

export interface GithubActionPostData {
  readonly ref: string;
  readonly inputs: {
    readonly baseUrl: string;
    readonly permalink: string;
  };
}

export class CStateStatuspageApi {
  private readonly cStatePageUrl: string;
  private gitHubOwner: string;
  private gitHubRepo: string;
  private gitHubBranch: string;
  private gitHubWorkflowFile: string;
  private secretHolder: SecretHolder<UpdateStatusSecret>;

  constructor(
    cStatePageUrl: string,
    gitHubOwner: string,
    gitHubRepo: string,
    gitHubBranch: string,
    gitHubWorkflowFile: string,
    secretHolder: SecretHolder<UpdateStatusSecret>,
  ) {
    this.cStatePageUrl = cStatePageUrl;
    this.gitHubOwner = gitHubOwner;
    this.gitHubRepo = gitHubRepo;
    this.gitHubBranch = gitHubBranch;
    this.gitHubWorkflowFile = gitHubWorkflowFile;
    this.secretHolder = secretHolder;
  }

  async getStatus(): Promise<CStateStatus> {
    const method = `${SERVICE}.getStatus` as const satisfies LoggerMethodType;
    const start = Date.now();
    logger.info({
      method,
      message: "Getting cState status",
    });

    const statusJsonUrl = `${this.cStatePageUrl}${STATUS_JSON_PATH}`;
    return await ky
      .get<CStateStatus>(statusJsonUrl)
      .catch((error: HTTPError) => {
        throw new Error(
          `method=${method} Unable to get cState status from ${statusJsonUrl}. Error ${
            error.response.status ? error.response.status : ""
          } ${error.message}`,
        );
      })
      .then((response) => response.json())
      .finally(() =>
        logger.info({
          method,
          message: "Getting cState status done",
          tookMs: Date.now() - start,
        }),
      );
  }

  async isActiveMaintenances(): Promise<boolean> {
    const status = await this.getStatus();
    return this.hasStatusActiveMaintenances(status);
  }

  private hasStatusActiveMaintenances(cStatus: CStateStatus): boolean {
    const method =
      `${SERVICE}.hasStatusActiveMaintenances` as const satisfies LoggerMethodType;
    // This is executed ever minute, so in worst case it will turn off one minute late.
    // Make it turn on max one minute too early :)
    const now = add(new Date(), { minutes: 1 });

    for (const issue of cStatus.pinnedIssues) {
      // CState has "2024-02-20 08:36:51.671186 +0000 UTC" date format in JSONs
      const starts = parseJSON(issue.createdAt);
      logger.debug({
        method,
        message: `Starts ${starts.toISOString()}, now+1min ${now.toISOString()}, active: ${isBefore(
          starts,
          now,
        )} issue: ${issue.permalink}`,
      });
      if (
        issue.permalink.includes(MAINTENANCE_ISSUE_PATH) &&
        isBefore(starts, now)
      ) {
        logger.info({
          method,
          message: `Active maintenance found: ${issue.title} ${issue.permalink} starts ${starts.toISOString()}, now ${starts.toISOString()}`,
        });
        return true;
      }
    }

    logger.info({
      method,
      message: "No active maintenance found",
    });
    return false;
  }

  async findActiveMaintenance(): Promise<ActiveMaintenance | undefined> {
    const status = await this.getStatus();
    const issue = this.findActiveMaintenanceFromStatus(status);
    if (issue) {
      return {
        issue,
        baseURL: status.baseURL,
      };
    }
    return undefined;
  }

  private findActiveMaintenanceFromStatus(
    cStatus: CStateStatus,
  ): PinnedIssue | undefined {
    const method =
      `${SERVICE}.findActiveMaintenance` as const satisfies LoggerMethodType;
    // This is executed ever minute, so in worst case it will turn off one minute late.
    // Make it turn on max one minute too early :)
    const now = add(new Date(), { minutes: 1 });

    for (const issue of cStatus.pinnedIssues) {
      // CState has "2024-02-20 08:36:51.671186 +0000 UTC" date format in JSONs
      const starts = parseJSON(issue.createdAt);
      logger.debug({
        method,
        message: `Starts ${starts.toISOString()}, now+1min ${now.toISOString()}, active: ${isBefore(
          starts,
          now,
        )} issue: ${issue.permalink}`,
      });
      if (
        issue.permalink.includes(MAINTENANCE_ISSUE_PATH) &&
        isBefore(starts, now)
      ) {
        logger.info({
          method,
          message: `Active maintenance found: ${issue.title} ${issue.permalink} starts ${starts.toISOString()}, now ${starts.toISOString()}`,
        });
        return issue;
      }
    }

    logger.info({
      method,
      message: "No active maintenance found",
    });
    return undefined;
  }

  async triggerUpdateMaintenanceGithubAction(
    maintenance: ActiveMaintenance,
  ): Promise<void> {
    const method =
      `${SERVICE}.triggerUpdateMaintenanceGithubAction` as const satisfies LoggerMethodType;

    const secret = await this.secretHolder.get();
    const data = {
      ref: `refs/heads/${this.gitHubBranch}`,
      inputs: {
        baseUrl: maintenance.baseURL,
        permalink: maintenance.issue.permalink,
      },
    } satisfies GithubActionPostData;
    const headers = {
      Accept: "application/vnd.github+json",
      "Content-Type": "application/vnd.github+json",
      Authorization: `token ${secret.gitHubPat}`,
    };
    const githubApi =
      `https://api.github.com/repos/${this.gitHubOwner}/${this.gitHubRepo}/actions/workflows/${this.gitHubWorkflowFile}/dispatches` as const;
    logger.info({
      method,
      message: "Trigger GitHub action",
      customActionUrl: githubApi,
    });
    const options = { json: data, headers: headers };

    try {
      const response = await ky.post(githubApi, options);
      if (response.ok) {
        logger.info({
          method,
          message: "Trigger GitHub action response",
          customActionUrl: githubApi,
          customResponseCode: response.status,
          customResponseText: response.statusText,
        });
      } else {
        logger.error({
          method,
          message: "Trigger GitHub action response failed.",
          customActionUrl: githubApi,
          customResponseCode: response.status,
          customResponseText: response.statusText,
        });
      }
    } catch (error) {
      const message = "Triggering GitHub action throw error.";
      let errorMessage = JSON.stringify(error);
      if (error instanceof HTTPError) {
        const serverMessage = await error.response.text();
        errorMessage = `${error.response.status} ${error.response.statusText} ${serverMessage}`;
      } else {
        errorMessage = `${errorMessage} Not HTTPError.`;
      }
      logger.error({
        method,
        message,
        customActionUrl: githubApi,
        customError: errorMessage,
      });
      throw new Error(`${method} ${message} ${errorMessage}`);
    }
  }
}
