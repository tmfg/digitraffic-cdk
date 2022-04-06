import * as UpdateFaultsService from "../../service/update-faults";
import {Integration} from "../../app-props";
import {AtonEnvKeys} from "../../keys";
import {SecretHolder} from "digitraffic-common/aws/runtime/secrets/secret-holder";

const secretHolder = SecretHolder.create();

const envValue = process.env[AtonEnvKeys.INTEGRATIONS] as string;
const integrations = envValue ? JSON.parse(envValue) as Integration[] : [];

export const handler = () => {
    return updateAllFaults();
};

async function updateAllFaults() {
    await secretHolder.setDatabaseCredentials();

    for (const integration of integrations) {
        await UpdateFaultsService.updateFaults(integration.url, integration.domain);
    }
}
