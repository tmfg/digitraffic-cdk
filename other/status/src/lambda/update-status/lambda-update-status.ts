import type { UpdateStatusSecret } from "../../secret.js";
import { NodePingApi } from "../../api/nodeping-api.js";
import * as StatusService from "../../service/status-service.js";
import { DigitrafficApi } from "../../api/digitraffic-api.js";
import { StatusEnvKeys } from "../../keys.js";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { monitoredApps } from "../../monitored-apps.js";

// Lambda is intended to be run every minute so the HTTP timeouts for the two HTTP requests should not exceed 1 min
const DEFAULT_TIMEOUT_MS = 25000 as const;

const secretHolder = SecretHolder.create<UpdateStatusSecret>();

const checkTimeout = Number(
  getEnvVariable(StatusEnvKeys.CHECK_TIMEOUT_SECONDS),
);
const checkInterval = Number(getEnvVariable(StatusEnvKeys.INTERVAL_MINUTES));

const gitHubOwner = getEnvVariable(StatusEnvKeys.GITHUB_OWNER);
const gitHubRepo = getEnvVariable(StatusEnvKeys.GITHUB_REPO);
const gitHubBranch = getEnvVariable(StatusEnvKeys.GITHUB_BRANCH);
const gitHubWorkflowFile = getEnvVariable(StatusEnvKeys.GITHUB_WORKFLOW_FILE);

/**
 * Updates StatusPage components and NodePing checks to correspond OpenAPI Specifications
 */
export const handler = async (): Promise<void> => {
  const digitrafficApi = new DigitrafficApi();
  const nodePingApi = new NodePingApi(
    secretHolder,
    DEFAULT_TIMEOUT_MS,
    checkTimeout,
    checkInterval,
  );

  await StatusService.updateComponentsAndChecks(
    monitoredApps,
    digitrafficApi,
    nodePingApi,
    secretHolder,
    gitHubOwner,
    gitHubRepo,
    gitHubBranch,
    gitHubWorkflowFile,
  );
};
