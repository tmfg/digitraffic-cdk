import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { AutoriApi } from "../../api/autori";
import { MaintenanceTrackingMunicipalityEnvKeys } from "../../keys";
import { MaintenanceTrackingAutoriSecret } from "../../model/maintenance-tracking-municipality-secret";
import { TrackingSaveResult } from "../../model/tracking-save-result";
import { AutoriUpdate } from "../../service/autori-update";
import * as CommonUpdate from "../../service/common-update";
import logger from "../../service/maintenance-logger";

const domainName = getEnvVariable(MaintenanceTrackingMunicipalityEnvKeys.DOMAIN_NAME);
const domainPrefix = getEnvVariable(MaintenanceTrackingMunicipalityEnvKeys.DOMAIN_PREFIX);

const proxyHolder = ProxyHolder.create();
const secretHolder = SecretHolder.create<MaintenanceTrackingAutoriSecret>(domainPrefix);
let autoriUpdateServiceHolder: AutoriUpdate | undefined;

export const handler = (): Promise<TrackingSaveResult> => {
    const start = Date.now();
    const method = "MaintenanceTrackingMunicipality.updateTrackingsForDomain";

    return proxyHolder
        .setCredentials()
        .then(() => secretHolder.get())
        .then(async (secret) => {
            const autoriUpdateService = getAutoriUpdateService(secret);
            try {
                await CommonUpdate.upsertDomain(domainName);
                await autoriUpdateService.updateContractsForDomain(domainName);
                await autoriUpdateService.updateTaskMappingsForDomain(domainName);

                return autoriUpdateService
                    .updateTrackingsForDomain(domainName)
                    .then((savedResult) => {
                        logger.info({
                            method,
                            message: `errors ${savedResult.errors}`,
                            tookMs: Date.now() - start,
                            customSizeBytes: savedResult.sizeBytes,
                            customCount: savedResult.saved,
                            customDomain: domainName
                        });
                        return savedResult;
                    })
                    .catch((error: Error) => {
                        logger.error({
                            method,
                            message: `failed after ${Date.now() - start} ms`,
                            customDomain: domainName,
                            error
                        });
                        throw error;
                    });
            } catch (error) {
                logger.error({
                    method,
                    message: `failed after ${Date.now() - start} ms`,
                    customDomain: domainName,
                    error
                });
                throw error;
            }
        })
        .finally(() => {
            logger.info({
                method,
                message: `finished`,
                customDomain: domainName,
                tookMs: Date.now() - start
            });
        });
};

function getAutoriUpdateService(secret: MaintenanceTrackingAutoriSecret): AutoriUpdate {
    if (autoriUpdateServiceHolder) {
        return autoriUpdateServiceHolder;
    }
    logger.info({
        method: "MaintenanceTrackingMunicipality.getAutoriUpdateService",
        message: `domain=${domainName} lambda was cold`
    });
    const autoriApi = new AutoriApi(secret);
    return new AutoriUpdate(autoriApi);
}
