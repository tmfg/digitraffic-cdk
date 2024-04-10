import type { SlackApi } from "@digitraffic/common/dist/utils/slack";
import { logger, type LoggerMethodType } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { CStateStatuspageApi } from "../api/cstate-statuspage-api.js";
import type { NodePingApi } from "../api/nodeping-api.js";

const SERVICE = "MaintenanceService" as const;

export async function handleMaintenance(
    nodePingApi: NodePingApi,
    cStateApi: CStateStatuspageApi,
    slackNotifyApi: SlackApi
): Promise<void> {
    const method = `${SERVICE}.handleMaintenance` as const satisfies LoggerMethodType;
    logger.info({
        method,
        message: "Read maintenance from status page"
    });

    const activeMaintenance = await cStateApi.findActiveMaintenance();
    const checks = await nodePingApi.getNodePingChecks();
    const enabledChecks = nodePingApi.getEnabledNodePingChecks(checks);
    const enabledChecksCount = enabledChecks.length;
    const disabledChecks = nodePingApi.getDisabledNodePingChecks(checks);
    const disabledChecksCount = disabledChecks.length;

    // Active maintenance found and there is enabled checks -> disable checks
    if (activeMaintenance && enabledChecksCount) {
        logger.info({
            method: method,
            message: `Active maintenances found, disabling ${enabledChecksCount} NodePing checks`
        });
        await nodePingApi.disableNodePingChecks();
        const checksToDisable = JSON.stringify(enabledChecks.map((c) => c.label));

        logger.info({
            method: method,
            message: `NodePing checks disabled ${enabledChecksCount}, maintenance has started!\nDisabled: ${checksToDisable}`
        });

        await cStateApi.triggerUpdateMaintenanceGithubAction(activeMaintenance);

        await slackNotifyApi.notify(
            `NodePing checks disabled ${enabledChecksCount} and cStateStatus maintenance triggered. Maintenance has started!`
        );

        // No active maintenance found and there is disabled checks -> enable checks
    } else if (!activeMaintenance && disabledChecksCount) {
        logger.info({
            method: method,
            message: `No active maintenances found, enabling ${disabledChecksCount} disabled NodePing checks`
        });
        await nodePingApi.enableNodePingChecks();
        const checksToEnable = JSON.stringify(disabledChecks.map((c) => c.label));

        logger.info({
            method: method,
            message: `NodePing checks enabled ${disabledChecksCount}, maintenance has ended!\n(Enabled: ${checksToEnable})`
        });

        await slackNotifyApi.notify(`NodePing checks enabled ${disabledChecksCount}. Maintenance has ended!`);
    } else {
        logger.info({
            method: method,
            message: `No change in maintenance status, activeMaintenance: ${JSON.stringify(activeMaintenance)}`
        });
    }
}
