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
const checkTimeout = Number(getEnvVariable(StatusEnvKeys.CHECK_TIMEOUT_SECONDS));
const checkInterval = Number(getEnvVariable(StatusEnvKeys.INTERVAL_MINUTES));
const cStatePageUrl = getEnvVariable(StatusEnvKeys.C_STATE_PAGE_URL);

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
        nodePingApi = new NodePingApi(secretHolder, DEFAULT_TIMEOUT_MS, checkTimeout, checkInterval);
        cStateApi = new CStateStatuspageApi(cStatePageUrl);
        statusReportApi = new StatusReportApi(secretHolder);
    }
}
