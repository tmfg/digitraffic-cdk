import * as TimestampsService from "../../service/timestamps";
import {RdsHolder} from "@digitraffic/common/aws/runtime/secrets/rds-holder";

const rdsHolder = RdsHolder.create();

export function handler() {
    return rdsHolder.setCredentials()
        .then(() => TimestampsService.deleteOldTimestampsAndPilotages());
}
