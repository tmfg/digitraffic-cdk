import * as TimestampsService from "../../service/timestamps";
import {withSecret} from "digitraffic-common/aws/runtime/secrets/secret";
import {PortactivityEnvKeys} from "../../keys";

export function handler() {
    return withSecret(process.env[PortactivityEnvKeys.SECRET_ID] as string, async () => {
        await TimestampsService.deleteOldTimestampsAndPilotages();
    });
}
