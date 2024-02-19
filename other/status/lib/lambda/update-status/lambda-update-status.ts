import { MonitoredApp } from "../../app-props";
import { UpdateStatusSecret } from "../../secret";
import { NodePingApi } from "../../api/nodeping-api";
import { StatuspageApi } from "../../api/statuspage";
import * as StatusService from "../../service/status-service";
import { DigitrafficApi } from "../../api/digitraffic-api";
import { StatusEnvKeys } from "../../keys";
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
