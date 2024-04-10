import type { UpdateStatusSecret } from "../../secret.js";
import * as StatusService from "../../service/status-service.js";
import { NodePingApi } from "../../api/nodeping-api.js";
import { StatusReportApi } from "../../api/statusreport-api.js";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { StatusEnvKeys } from "../../keys.js";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { CStateStatuspageApi } from "../../api/cstate-statuspage-api.js";
import { logger, type LoggerMethodType } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const secretHolder = SecretHolder.create<UpdateStatusSecret>();
// Lambda is intended to be run every minute so the HTTP timeouts for the two HTTP requests should not exceed 1 min
const DEFAULT_TIMEOUT_MS = 25000 as const;
const CHECK_TIMEOUT = Number(getEnvVariable(StatusEnvKeys.CHECK_TIMEOUT_SECONDS));
const CHECK_INTERVAL = Number(getEnvVariable(StatusEnvKeys.INTERVAL_MINUTES));
const C_STATE_PAGE_URL = getEnvVariable(StatusEnvKeys.C_STATE_PAGE_URL);
const GITHUB_OWNER = getEnvVariable(StatusEnvKeys.GITHUB_OWNER);
const GITHUB_REPO = getEnvVariable(StatusEnvKeys.GITHUB_REPO);
const GITHUB_BRANCH = getEnvVariable(StatusEnvKeys.GITHUB_BRANCH);
const GITHUB_UPDATE_MAINTENANCE_WORKFLOW_FILE = getEnvVariable(
    StatusEnvKeys.GITHUB_UPDATE_MAINTENANCE_WORKFLOW_FILE
);

let nodePingApi: NodePingApi;
let statusReportApi: StatusReportApi;
let cStateApi: CStateStatuspageApi;
/**
 * Checks current status of StatusPage and NodePing and sends report to Slack
 */
export const handler = async (): Promise<void> => {
    const method = `LambdaCheckComponentStates.handler` as const satisfies LoggerMethodType;
    init();

    const componentStatuses = await StatusService.getNodePingAndStatuspageComponentNotInSyncStatuses(
        nodePingApi,
        cStateApi
    );

    if (componentStatuses.length) {
        logger.info({
            method,
            message: `Nodeping and statuspage not in sync. Diff: ${JSON.stringify(componentStatuses)}`
        });
        await statusReportApi.sendReport(componentStatuses);
    } else {
        logger.info({ method, message: "Nodeping and statuspage in sync" });
    }
};

function init(): void {
    if (!nodePingApi) {
        nodePingApi = new NodePingApi(secretHolder, DEFAULT_TIMEOUT_MS, CHECK_TIMEOUT, CHECK_INTERVAL);
        cStateApi = new CStateStatuspageApi(
            C_STATE_PAGE_URL,
            GITHUB_OWNER,
            GITHUB_REPO,
            GITHUB_BRANCH,
            GITHUB_UPDATE_MAINTENANCE_WORKFLOW_FILE,
            secretHolder
        );
        statusReportApi = new StatusReportApi(secretHolder);
    }
}
