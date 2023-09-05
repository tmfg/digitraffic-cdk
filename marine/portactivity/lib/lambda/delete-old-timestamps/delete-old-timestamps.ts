import * as TimestampsService from "../../service/timestamps";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";

const rdsHolder = RdsHolder.create();

export function handler(): Promise<void> {
    return rdsHolder.setCredentials().then(() => TimestampsService.deleteOldTimestampsAndPilotages());
}
