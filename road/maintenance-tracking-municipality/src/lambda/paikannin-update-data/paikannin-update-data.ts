import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { PaikanninApi } from "../../api/paikannin.js";
import { MaintenanceTrackingMunicipalityEnvKeys } from "../../keys.js";
import { type MaintenanceTrackingPaikanninSecret } from "../../model/maintenance-tracking-municipality-secret.js";
import { type TrackingSaveResult } from "../../model/tracking-save-result.js";
import * as CommonUpdate from "../../service/common-update.js";
import { PaikanninUpdate } from "../../service/paikannin-update.js";
import logger from "../../service/maintenance-logger.js";
import { type Handler } from "aws-lambda";

const domainName = getEnvVariable(
  MaintenanceTrackingMunicipalityEnvKeys.DOMAIN_NAME,
);
const domainPrefix = getEnvVariable(
  MaintenanceTrackingMunicipalityEnvKeys.DOMAIN_PREFIX,
);

const proxyHolder: ProxyHolder = ProxyHolder.create();
const secretHolder = SecretHolder.create<MaintenanceTrackingPaikanninSecret>(
  domainPrefix,
);
let paikanninUpdateServiceHolder: PaikanninUpdate | undefined;

export const handler: Handler = (): Promise<TrackingSaveResult> => {
  const start = Date.now();
  const method = "MaintenanceTrackingMunicipality.updateTrackingsForDomain";
  const wasWarm = !!paikanninUpdateServiceHolder;

  return proxyHolder
    .setCredentials()
    .then(() => secretHolder.get())
    .then(async (secret) => {
      const paikanninUpdateService = getPaikanninUpdateService(secret);
      try {
        await CommonUpdate.upsertDomain(domainName);
        await paikanninUpdateService.upsertContractForDomain(domainName);
        await paikanninUpdateService.updateTaskMappingsForDomain(domainName);

        return await paikanninUpdateService
          .updateTrackingsForDomain(domainName)
          .then((savedResult) => {
            logger.info({
              method,
              message: `errors ${savedResult.errors}`,
              customDomain: domainName,
              tookMs: Date.now() - start,
              customSizeBytes: savedResult.sizeBytes,
              customCount: savedResult.saved,
            });
            return savedResult;
          })
          .catch((error: Error) => {
            logger.error({
              method,
              message: `failed after ${Date.now() - start} ms`,
              customDomain: domainName,
              error,
            });
            throw error;
          });
      } catch (error) {
        logger.error({
          method,
          message: `failed after ${Date.now() - start} ms`,
          customDomain: domainName,
          error,
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
        tookMs: Date.now() - start,
      });
    });
};

function getPaikanninUpdateService(
  secret: MaintenanceTrackingPaikanninSecret,
): PaikanninUpdate {
  if (paikanninUpdateServiceHolder) {
    return paikanninUpdateServiceHolder;
  }
  const paikanninApi = new PaikanninApi(secret.apikey, secret.url);
  return new PaikanninUpdate(paikanninApi);
}
