import * as TimestampsService from "../../service/timestamps";
import {PortactivityEnvKeys} from "../../keys";
import {withDbSecret} from "digitraffic-common/aws/runtime/secrets/dbsecret";

export function handler() {
    return withDbSecret(process.env[PortactivityEnvKeys.SECRET_ID] as string, async () => {
        await TimestampsService.deleteOldTimestampsAndPilotages();
    });
}
