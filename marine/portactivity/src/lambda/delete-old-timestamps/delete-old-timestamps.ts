import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import * as TimestampsService from "../../service/timestamps.js";

const rdsHolder = RdsHolder.create();

export function handler(): Promise<void> {
  return rdsHolder
    .setCredentials()
    .then(() => TimestampsService.deleteOldTimestampsAndPilotages());
}
