import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { AutoriApi } from "../../api/autori.js";
import { MaintenanceTrackingMunicipalityEnvKeys } from "../../keys.js";
import {
    type MaintenanceTrackingAutoriSecret
} from "../../model/maintenance-tracking-municipality-secret.js";
import { type TrackingSaveResult } from "../../model/tracking-save-result.js";
import { AutoriUpdate } from "../../service/autori-update.js";
import * as CommonUpdate from "../../service/common-update.js";
import logger from "../../service/maintenance-logger.js";
import { type Handler } from "aws-lambda";

const domainName = getEnvVariable(MaintenanceTrackingMunicipalityEnvKeys.DOMAIN_NAME);
const domainPrefix = getEnvVariable(MaintenanceTrackingMunicipalityEnvKeys.DOMAIN_PREFIX);

const proxyHolder: ProxyHolder = ProxyHolder.create();
const secretHolder = SecretHolder.create<MaintenanceTrackingAutoriSecret>(domainPrefix);
let autoriUpdateServiceHolder: AutoriUpdate | undefined;

export const handler: Handler = (): Promise<TrackingSaveResult> => {
    const start = Date.now();
    const method = "MaintenanceTrackingMunicipality.updateTrackingsForDomain";
    const wasWarm = !!autoriUpdateServiceHolder;

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
                customLambdaWasWarm: wasWarm,
                tookMs: Date.now() - start
            });
        });
};

function getAutoriUpdateService(secret: MaintenanceTrackingAutoriSecret): AutoriUpdate {
    if (autoriUpdateServiceHolder) {
        return autoriUpdateServiceHolder;
    }
    const autoriApi = new AutoriApi(secret);
    return new AutoriUpdate(autoriApi);
}
