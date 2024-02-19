import { UpdateStatusSecret } from "../../secret";
import * as StatusService from "../../service/status-service";
import { StatuspageApi } from "../../api/statuspage";
import { NodePingApi } from "../../api/nodeping-api";
import { StatusReportApi } from "../../api/statusreport-api";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { StatusEnvKeys } from "../../keys";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { CStateStatuspageApi } from "../../api/cstate-statuspage-api";

const secretHolder = SecretHolder.create<UpdateStatusSecret>();
const STATUSPAGE_URL = getEnvVariable(StatusEnvKeys.STATUSPAGE_URL);
// Lambda is intended to be run every minute so the HTTP timeouts for the two HTTP requests should not exceed 1 min
const DEFAULT_TIMEOUT_MS = 25000 as const;
const checkTimeout = Number(getEnvVariable(StatusEnvKeys.CHECK_TIMEOUT_SECONDS));
const checkInterval = Number(getEnvVariable(StatusEnvKeys.INTERVAL_MINUTES));
const cStatePageUrl = getEnvVariable(StatusEnvKeys.C_STATE_PAGE_URL);

let statuspageApi: StatuspageApi;
let nodePingApi: NodePingApi;
let statusReportApi: StatusReportApi;
let cStateApi: CStateStatuspageApi;
/**
 * Checks current status of StatusPage and NodePing and sends report to Slack
 */
export const handler = async (): Promise<void> => {
    init();

    const componentStatuses = await StatusService.getNodePingAndStatuspageComponentNotInSyncStatuses(
        statuspageApi,
        nodePingApi,
        cStateApi
    );

    if (componentStatuses.length) {
        await statusReportApi.sendReport(componentStatuses);
    }
};

function init(): void {
    if (!statuspageApi) {
        statuspageApi = new StatuspageApi(secretHolder, STATUSPAGE_URL, DEFAULT_TIMEOUT_MS);
        nodePingApi = new NodePingApi(secretHolder, DEFAULT_TIMEOUT_MS, checkTimeout, checkInterval);

        cStateApi = new CStateStatuspageApi(cStatePageUrl);
        statusReportApi = new StatusReportApi(secretHolder);
    }
}
