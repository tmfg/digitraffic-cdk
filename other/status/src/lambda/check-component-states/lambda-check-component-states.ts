import type { LoggerMethodType } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { SlackApi } from "@digitraffic/common/dist/utils/slack";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { CStateStatuspageApi } from "../../api/cstate-statuspage-api.js";
import { NodePingApi } from "../../api/nodeping-api.js";
import { StatusEnvKeys } from "../../keys.js";
import type { UpdateStatusSecret } from "../../secret.js";
import * as StatusService from "../../service/status-service.js";

const secretHolder = SecretHolder.create<UpdateStatusSecret>();
// Lambda is intended to be run every minute so the HTTP timeouts for the two HTTP requests should not exceed 1 min
const DEFAULT_TIMEOUT_MS = 25000 as const;
const CHECK_TIMEOUT = Number(
  getEnvVariable(StatusEnvKeys.CHECK_TIMEOUT_SECONDS),
);
const CHECK_INTERVAL = Number(getEnvVariable(StatusEnvKeys.INTERVAL_MINUTES));
const C_STATE_PAGE_URL = getEnvVariable(StatusEnvKeys.C_STATE_PAGE_URL);
const GITHUB_OWNER = getEnvVariable(StatusEnvKeys.GITHUB_OWNER);
const GITHUB_REPO = getEnvVariable(StatusEnvKeys.GITHUB_REPO);
const GITHUB_BRANCH = getEnvVariable(StatusEnvKeys.GITHUB_BRANCH);
const GITHUB_UPDATE_MAINTENANCE_WORKFLOW_FILE = getEnvVariable(
  StatusEnvKeys.GITHUB_UPDATE_MAINTENANCE_WORKFLOW_FILE,
);

let nodePingApi: NodePingApi;
let slackApi: SlackApi;
let cStateApi: CStateStatuspageApi;
/**
 * Checks current status of StatusPage and NodePing and sends report of differences to Slack
 */
export const handler = async (): Promise<void> => {
  const method =
    `LambdaCheckComponentStates.handler` as const satisfies LoggerMethodType;
  const secret = await secretHolder.get();
  init(secret);

  const componentStatuses =
    await StatusService.getNodePingAndStatuspageComponentNotInSyncStatuses(
      nodePingApi,
      cStateApi,
    );

  if (componentStatuses.length) {
    logger.info({
      method,
      message: `Nodeping and statuspage not in sync. Diff: ${JSON.stringify(
        componentStatuses,
      )}`,
    });
    const statesText = componentStatuses.join("\n");
    await slackApi.notify(statesText);
  } else {
    logger.info({ method, message: "Nodeping and statuspage in sync" });
  }
};

function init(secret: UpdateStatusSecret): void {
  if (!nodePingApi) {
    nodePingApi = new NodePingApi(
      secretHolder,
      DEFAULT_TIMEOUT_MS,
      CHECK_TIMEOUT,
      CHECK_INTERVAL,
    );
    cStateApi = new CStateStatuspageApi(
      C_STATE_PAGE_URL,
      GITHUB_OWNER,
      GITHUB_REPO,
      GITHUB_BRANCH,
      GITHUB_UPDATE_MAINTENANCE_WORKFLOW_FILE,
      secretHolder,
    );

    slackApi = new SlackApi(secret.reportUrl);
  }
}
