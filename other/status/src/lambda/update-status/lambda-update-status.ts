import type { MonitoredApp } from "../../app-props.js";
import type { UpdateStatusSecret } from "../../secret.js";
import { NodePingApi } from "../../api/nodeping-api.js";
import { StatuspageApi } from "../../api/statuspage.js";
import * as StatusService from "../../service/status-service.js";
import { DigitrafficApi } from "../../api/digitraffic-api.js";
import { StatusEnvKeys } from "../../keys.js";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";

// Lambda is intended to be run every minute so the HTTP timeouts for the two HTTP requests should not exceed 1 min
const DEFAULT_TIMEOUT_MS = 25000 as const;

const secretHolder = SecretHolder.create<UpdateStatusSecret>();

const apps = JSON.parse(getEnvVariable(StatusEnvKeys.APPS)) as MonitoredApp[];
const checkTimeout = Number(getEnvVariable(StatusEnvKeys.CHECK_TIMEOUT_SECONDS));
const checkInterval = Number(getEnvVariable(StatusEnvKeys.INTERVAL_MINUTES));
const statusPageUrl = getEnvVariable(StatusEnvKeys.STATUSPAGE_URL);

const gitHubOwner = getEnvVariable(StatusEnvKeys.GITHUB_OWNER);
const gitHubRepo = getEnvVariable(StatusEnvKeys.GITHUB_REPO);
const gitHubBranch = getEnvVariable(StatusEnvKeys.GITHUB_BRANCH);
const gitHubWorkflowFile = getEnvVariable(StatusEnvKeys.GITHUB_WORKFLOW_FILE);

/**
 * Updates StatusPage components and NodePing checks
 */
export const handler = async (): Promise<void> => {
    const digitrafficApi = new DigitrafficApi();
    const statuspageApi = new StatuspageApi(secretHolder, statusPageUrl, DEFAULT_TIMEOUT_MS);
    const nodePingApi = new NodePingApi(secretHolder, DEFAULT_TIMEOUT_MS, checkTimeout, checkInterval);

    await StatusService.updateComponentsAndChecks(
        apps,
        digitrafficApi,
        statuspageApi,
        nodePingApi,
        secretHolder,
        gitHubOwner,
        gitHubRepo,
        gitHubBranch,
        gitHubWorkflowFile
    );
};
