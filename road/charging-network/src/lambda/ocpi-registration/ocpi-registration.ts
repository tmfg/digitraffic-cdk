import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import type { DbOcpiCpo } from "../../model/dao-models.js";
import {
    findUnregisteredCpos as OcpiRegistrationService_findUnregisteredCpos,
    handleCpoRegistration as OcpiRegistrationService_handleCpoRegistration
} from "../../service/ocpi-registration-service.js";

const proxyHolder = ProxyHolder.create();
const method = `OcpiRegistration.handler` as const;

export const handler = async (): Promise<void> => {
    const start = Date.now();

    await proxyHolder
        .setCredentials()
        .then(() => OcpiRegistrationService_findUnregisteredCpos())
        .then(async (newCpos: DbOcpiCpo[]) => {
            for (const cpo of newCpos) {
                try {
                    await OcpiRegistrationService_handleCpoRegistration(cpo);
                } catch (e) {
                    logger.error({
                        method,
                        tookMs: Date.now() - start,
                        customDtCpoId: cpo.dt_cpo_id,
                        message: "Error while registering cpo"
                    });
                }
            }
        })
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
                message: "Error while registering CPOs"
            });
        });
};
