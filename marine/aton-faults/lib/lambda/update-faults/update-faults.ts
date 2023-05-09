import * as UpdateFaultsService from "../../service/update-faults";
import { Integration } from "../../app-props";
import { AtonEnvKeys } from "../../keys";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { getEnvVariableOrElse } from "@digitraffic/common/dist/utils/utils";

const proxyHolder = ProxyHolder.create();

const envValue = getEnvVariableOrElse(AtonEnvKeys.INTEGRATIONS, undefined);
const integrations = envValue ? (JSON.parse(envValue) as Integration[]) : [];

export const handler = (): Promise<void> => {
    return proxyHolder.setCredentials().then(() => updateAllFaults());
};

async function updateAllFaults(): Promise<void> {
    for (const integration of integrations) {
        await UpdateFaultsService.updateFaults(integration.url, integration.domain);
    }
}
