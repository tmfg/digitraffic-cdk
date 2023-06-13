import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { cleanMaintenanceTrackingData } from "../../service/maintenance-tracking";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const proxyHolder = ProxyHolder.create();

export const handler = (): void => {
    const start = Date.now();
    proxyHolder
        .setCredentials()
        .then(() => {
            logger.debug(`method=MaintenanceTracking.cleanMaintenanceTrackingData start`);
            return cleanMaintenanceTrackingData(26); // Just to be sure 24h history is available
        })
        .finally(() => {
            logger.info({
                method: "MaintenanceTracking.cleanMaintenanceTrackingData",
                tookMs: Date.now() - start
            });
        })
        .catch((error: Error) => {
            logger.error({
                method: "MaintenanceTracking.cleanMaintenanceTrackingData",
                message: "failed",
                tookMs: Date.now() - start,
                error
            });
            throw error;
        });
};
