import {MaintenanceTrackingMunicipalitySecret} from "../../model/maintenance-tracking-municipality-secret";
import {withDbSecret} from "digitraffic-common/aws/runtime/secrets/dbsecret";
import { MaintenanceTrackingMunicipalityEnvKeys } from "../../keys";
import {AutoriUpdate, TrackingSaveResult} from "../../service/autori-update";
import {AutoriApi} from "../../api/autori";
import {getSecret} from "digitraffic-common/aws/runtime/secrets/secret";

const secretId = process.env.SECRET_ID as string;
const domainName = process.env[MaintenanceTrackingMunicipalityEnvKeys.DOMAIN_NAME] as string;
const domainPrefix = process.env[MaintenanceTrackingMunicipalityEnvKeys.DOMAIN_PREFIX] as string;

export const handler = async (): Promise<void> => {
    const start = Date.now();

    const secret = await getSecret<MaintenanceTrackingMunicipalitySecret>(secretId);
    const autoriApi = new AutoriApi(secret.username, secret.password, secret.url);
    const autoriUpdateService = new AutoriUpdate(autoriApi);

    try {
        await withDbSecret(secretId, (secret: MaintenanceTrackingMunicipalitySecret) => {
            return autoriUpdateService.updateContracts(domainName);
        }, {
            prefix: domainPrefix,
        });

        await withDbSecret(secretId, (secret: MaintenanceTrackingMunicipalitySecret) => {
            return autoriUpdateService.updateTasks(domainName);
        }, {
            prefix: domainPrefix,
        });

        const savedResult = await withDbSecret(secretId, (secret: MaintenanceTrackingMunicipalitySecret) => {
            return autoriUpdateService.updateTrackings(domainName);
        }, {
            prefix: domainPrefix,
        }) as TrackingSaveResult;
        console.info(`method=autoriUpdateData saved: ${savedResult.saved} and errors: ${savedResult.errors} tookMs=`);
        console.info(`method=updateData.${domainName} saved: ${savedResult.saved} and errors: ${savedResult.errors} tookMs=${(Date.now()-start)}`);
    } catch (error) {
        console.error('method=updateData upsertWorkMachine failed', error);
        throw error;
    }
};
