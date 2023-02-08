import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { AutoriApi } from "../../api/autori";
import { MaintenanceTrackingMunicipalityEnvKeys } from "../../keys";
import { MaintenanceTrackingAutoriSecret } from "../../model/maintenance-tracking-municipality-secret";
import { TrackingSaveResult } from "../../model/tracking-save-result";
import { AutoriUpdate } from "../../service/autori-update";
import * as CommonUpdate from "../../service/common-update";

const domainName = getEnvVariable(
    MaintenanceTrackingMunicipalityEnvKeys.DOMAIN_NAME
);
const domainPrefix = getEnvVariable(
    MaintenanceTrackingMunicipalityEnvKeys.DOMAIN_PREFIX
);

const proxyHolder = ProxyHolder.create();
const secretHolder =
    SecretHolder.create<MaintenanceTrackingAutoriSecret>(domainPrefix);
let autoriUpdateServiceHolder: AutoriUpdate | undefined;

export const handler = (): Promise<TrackingSaveResult> => {
    const start = Date.now();

    return proxyHolder
        .setCredentials()
        .then(() => secretHolder.get())
        .then(async (secret) => {
            const autoriUpdateService = getAutoriUpdateService(secret);
            try {
                await CommonUpdate.upsertDomain(domainName);
                await autoriUpdateService.updateContractsForDomain(domainName);
                await autoriUpdateService.updateTaskMappingsForDomain(
                    domainName
                );

                return autoriUpdateService
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

function getAutoriUpdateService(
    secret: MaintenanceTrackingAutoriSecret
): AutoriUpdate {
    if (autoriUpdateServiceHolder) {
        return autoriUpdateServiceHolder;
    }
    console.info(
        `method=MaintenanceTrackingMunicipality.getAutoriUpdateService domain=${domainName} lambda was cold`
    );
    const autoriApi = new AutoriApi(secret);
    return new AutoriUpdate(autoriApi);
}
