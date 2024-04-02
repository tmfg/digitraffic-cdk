import { handleMaintenance } from "../../service/maintenance-service.js";
import type { UpdateStatusSecret } from "../../secret.js";
import { CStateStatuspageApi } from "../../api/cstate-statuspage-api.js";
import { NodePingApi } from "../../api/nodeping-api.js";
import { SlackApi } from "@digitraffic/common/dist/utils/slack";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { StatusEnvKeys } from "../../keys.js";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";

const C_STATE_PAGE_URL = getEnvVariable(StatusEnvKeys.C_STATE_PAGE_URL);
// Lambda is intended to be run every minute so the HTTP timeouts for the two HTTP requests should not exceed 1 min
const DEFAULT_TIMEOUT_MS = 25000 as const;
const checkTimeout = Number(getEnvVariable(StatusEnvKeys.CHECK_TIMEOUT_SECONDS));
const checkInterval = Number(getEnvVariable(StatusEnvKeys.INTERVAL_MINUTES));

const secretHolder = SecretHolder.create<UpdateStatusSecret>();

let slackNotifyApi: SlackApi | undefined;
let cStateApi: CStateStatuspageApi | undefined;
let nodePingApi: NodePingApi | undefined;

/**
 * Checks StatusPage maintenances and disables NodePing checks if maintenance is active
 * or re-enables checks if maintenance is over
 */
export const handler = async (): Promise<void> => {
    const secret = await secretHolder.get();
    slackNotifyApi = slackNotifyApi ? slackNotifyApi : new SlackApi(secret.reportUrl);
    cStateApi = cStateApi ? cStateApi : new CStateStatuspageApi(C_STATE_PAGE_URL);
    nodePingApi = nodePingApi
        ? nodePingApi
        : new NodePingApi(secretHolder, DEFAULT_TIMEOUT_MS, checkTimeout, checkInterval);

    await handleMaintenance(nodePingApi, cStateApi, slackNotifyApi);
};
