import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { PaikanninApi } from "../../api/paikannin";
import { MaintenanceTrackingMunicipalityEnvKeys } from "../../keys";
import { MaintenanceTrackingPaikanninSecret } from "../../model/maintenance-tracking-municipality-secret";
import { TrackingSaveResult } from "../../model/tracking-save-result";
import * as CommonUpdate from "../../service/common-update";
import { PaikanninUpdate } from "../../service/paikannin-update";

const domainName = getEnvVariable(
    MaintenanceTrackingMunicipalityEnvKeys.DOMAIN_NAME
);
const domainPrefix = getEnvVariable(
    MaintenanceTrackingMunicipalityEnvKeys.DOMAIN_PREFIX
);

const proxyHolder = ProxyHolder.create();
const secretHolder =
    SecretHolder.create<MaintenanceTrackingPaikanninSecret>(domainPrefix);
let paikanninUpdateServiceHolder: PaikanninUpdate | undefined;

export const handler = (): Promise<TrackingSaveResult> => {
    const start = Date.now();

    return proxyHolder
        .setCredentials()
        .then(() => secretHolder.get())
        .then(async (secret) => {
            const paikanninUpdateService = getPaikanninUpdateService(secret);
            try {
                await CommonUpdate.upsertDomain(domainName);
                await paikanninUpdateService.upsertContractForDomain(
                    domainName
                );
                await paikanninUpdateService.updateTaskMappingsForDomain(
                    domainName
                );

                return await paikanninUpdateService
                    .updateTrackingsForDomain(domainName)
                    .then((savedResult) => {
                        console.info(
                            `method=MaintenanceTrackingMunicipality.updateTrackingsForDomain domain=${domainName} count=${
                                savedResult.saved
                            } errors=${savedResult.errors} sizeBytes=${
                                savedResult.sizeBytes
                            } tookMs=${Date.now() - start}`
                        );
                        return savedResult;
                    })
                    .catch((error) => {
                        console.error(
                            `method=MaintenanceTrackingMunicipality.updateTrackingsForDomain domain=${domainName} failed after ${
                                Date.now() - start
                            } ms`,
                            error
                        );
                        throw error;
                    });
            } catch (error) {
                console.error(
                    `method=MaintenanceTrackingMunicipality.updateTrackingsForDomain domain=${domainName} failed after ${
                        Date.now() - start
                    } ms`,
                    error
                );
                throw error;
            }
        })
        .finally(() => {
            console.info(
                `method=MaintenanceTrackingMunicipality.updateTrackingsForDomain domain=${domainName} tookMs=${
                    Date.now() - start
                }`
            );
        });
};

function getPaikanninUpdateService(
    secret: MaintenanceTrackingPaikanninSecret
): PaikanninUpdate {
    if (paikanninUpdateServiceHolder) {
        return paikanninUpdateServiceHolder;
    }
    console.info(
        `method=MaintenanceTrackingMunicipality.getPaikanninUpdateService domain=${domainName} lambda was cold`
    );
    const paikanninApi = new PaikanninApi(secret.apikey, secret.url);
    return new PaikanninUpdate(paikanninApi);
}
