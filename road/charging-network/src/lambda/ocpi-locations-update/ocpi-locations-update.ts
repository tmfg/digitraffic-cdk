import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { DbOcpiCpo } from "../../model/dao-models";
import * as OcpiLocationService from "../../service/ocpi-location-service";
import * as OcpiRegistrationService from "../../service/ocpi-registration-service";

const proxyHolder = ProxyHolder.create();

const method = `OcpiLocationsUpdate.handler` as const;

export const handler = async (): Promise<void> => {
    const start = Date.now();

    await proxyHolder
        .setCredentials()
        .then(() => OcpiRegistrationService.findRegisteredCPOs())
        .then((cpos: DbOcpiCpo[]) => OcpiLocationService.updateLocationsForCpos(cpos))
        .finally(() => {
            logger.info({
                method,
                tookMs: Date.now() - start
            });
        })
        .catch((error: Error) => {
            logger.error({
                method,
                tookMs: Date.now() - start,
                stack: error.stack,
                message: "Error while updating locations"
            });
            throw error;
        });
};
