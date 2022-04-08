import * as UpdateFaultsService from "../../service/update-faults";
import {Integration} from "../../app-props";
import {AtonEnvKeys} from "../../keys";
import {ProxyHolder} from "digitraffic-common/aws/runtime/secrets/proxy-holder";

const proxyHolder = ProxyHolder.create();

const envValue = process.env[AtonEnvKeys.INTEGRATIONS] as string;
const integrations = envValue ? JSON.parse(envValue) as Integration[] : [];

export const handler = () => {
    return proxyHolder.setCredentials()
        .then(() => updateAllFaults());
};

async function updateAllFaults() {
    for (const integration of integrations) {
        await UpdateFaultsService.updateFaults(integration.url, integration.domain);
    }
}
