import * as TimestampsService from "../../service/timestamps";
import {SecretHolder} from "@digitraffic/common/aws/runtime/secrets/secret-holder";

const secretHolder = SecretHolder.create();

export function handler() {
    secretHolder.setDatabaseCredentials()
        .then(async () => await TimestampsService.deleteOldTimestampsAndPilotages());
}
