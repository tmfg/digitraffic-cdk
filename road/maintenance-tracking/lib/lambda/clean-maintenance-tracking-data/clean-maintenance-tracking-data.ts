import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { cleanMaintenanceTrackingData } from "../../service/maintenance-tracking";

const proxyHolder = ProxyHolder.create();

export const handler = () => {
    const start = Date.now();
    proxyHolder
        .setCredentials()
        .then(() => {
            console.info(
                "DEBUG method=cleanMaintenanceTrackingDataLambda start"
            );
            return cleanMaintenanceTrackingData(26); // Just to be sure 24h history is available
        })
        .finally(() => {
            console.info(
                "method=cleanMaintenanceTrackingDataLambda tookMs=%d",
                Date.now() - start
            );
        })
        .catch((error) => {
            console.error(
                `method=cleanMaintenanceTrackingDataLambda failed tookMs=${
                    Date.now() - start
                }`,
                error
            );
        });
};
