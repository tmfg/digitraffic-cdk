import type { SlackApi } from "@digitraffic/common/dist/utils/slack";
import { logger, type LoggerMethodType } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { CStateStatuspageApi } from "../api/cstate-statuspage-api.js";
import type { StatuspageApi } from "../api/statuspage.js";
import type { NodePingApi } from "../api/nodeping-api.js";

const SERVICE = "MaintenanceService" as const;

export async function handleMaintenance(
    nodePingApi: NodePingApi,
    cStateApi: CStateStatuspageApi,
    slackNotifyApi: SlackApi,
    statuspageApi: StatuspageApi
): Promise<void> {
    const method = `${SERVICE}.handleMaintenance` as const satisfies LoggerMethodType;
    logger.info({
        method,
        message: "Read maintenance from status page"
    });

    const activeMaintenances = await statuspageApi.getActiveStatusPageMaintenances();

    const isCStateActiveMaintenances = await cStateApi.isActiveMaintenances();

    const checks = await nodePingApi.getNodePingChecks();
    const enabledChecks = nodePingApi.getEnabledNodePingChecks(checks);
    const enabledChecksCount = enabledChecks.length;
    const disabledChecks = nodePingApi.getDisabledNodePingChecks(checks);
    const disabledChecksCount = disabledChecks.length;
    const maintenanceIsOn: boolean =
        isCStateActiveMaintenances || activeMaintenances.scheduled_maintenances.length > 0;
    // Active maintenance found and there is enabled checks -> disable checks
    if (maintenanceIsOn && enabledChecksCount) {
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

        await slackNotifyApi.notify(
            `NodePing checks disabled ${enabledChecksCount}, maintenance has started!`
        );
        // No active maintenance found and there is disabled checks -> enable checks
    } else if (!maintenanceIsOn && disabledChecksCount) {
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

        await slackNotifyApi.notify(`NodePing checks enabled ${disabledChecksCount}, maintenance has ended!`);
    } else {
        logger.info({
            method: method,
            message: `No change in maintenance status, maintenance active: ${JSON.stringify(maintenanceIsOn)}`
        });
    }
}
