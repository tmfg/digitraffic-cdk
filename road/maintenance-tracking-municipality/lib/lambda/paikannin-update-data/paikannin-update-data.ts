import {SecretFunction, withDbSecret} from "digitraffic-common/aws/runtime/secrets/dbsecret";
import {PaikanninApi} from "../../api/paikannin";
import {MaintenanceTrackingMunicipalityEnvKeys} from "../../keys";
import {MaintenanceTrackingPaikanninSecret} from "../../model/maintenance-tracking-municipality-secret";
import {TrackingSaveResult} from "../../model/tracking-save-result";
import * as CommonUpdate from "../../service/common-update";
import {PaikanninUpdate} from "../../service/paikannin-update";

const secretId = process.env.SECRET_ID as string;
const domainName = process.env[MaintenanceTrackingMunicipalityEnvKeys.DOMAIN_NAME] as string;
const domainPrefix = process.env[MaintenanceTrackingMunicipalityEnvKeys.DOMAIN_PREFIX] as string;

let paikanninUpdateService : PaikanninUpdate;

export function handlerFn(doWithSecret: SecretFunction<MaintenanceTrackingPaikanninSecret>) {
    return async () : Promise<TrackingSaveResult> => {
        const start = Date.now();

        if (!paikanninUpdateService) {
            console.info(`method=MaintenanceTrackingMunicipality.paikanninUpdateData domain=${domainName} lambda was cold`);
            await doWithSecret(secretId, (secret: MaintenanceTrackingPaikanninSecret) => {
                const paikanninApi = new PaikanninApi(secret.apikey, secret.url);
                paikanninUpdateService = new PaikanninUpdate(paikanninApi);
            }, {
                prefix: domainPrefix,
            });
        }

        try {
            await CommonUpdate.upsertDomain(domainName);
            await paikanninUpdateService.upsertContractForDomain(domainName);
            await paikanninUpdateService.updateTaskMappingsForDomain(domainName);

            return paikanninUpdateService.updateTrackingsForDomain(domainName)
                .then(savedResult => {
                    console.info(`method=MaintenanceTrackingMunicipality.paikanninUpdateData domain=${domainName} count=${savedResult.saved} and errors=${savedResult.errors} tookMs=${(Date.now() - start)}`);
                    return savedResult;
                });
        } catch (error) {
            console.error(`method=MaintenanceTrackingMunicipality.paikanninUpdateData failed after ${(Date.now() - start)} ms`, error);
            throw error;
        }
    };
}

export const handler = handlerFn(withDbSecret);