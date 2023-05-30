import * as TimestampsService from "../../service/timestamps";
import * as IdUtils from "@digitraffic/common/dist/marine/id_utils";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";

interface GetTimeStampsEvent {
    readonly locode?: string;
    readonly mmsi?: number;
    readonly imo?: number;
    readonly source?: string;
}

const rdsHolder = RdsHolder.create();

export const handler = (event: GetTimeStampsEvent) => {
    return rdsHolder
        .setCredentials()
        .then(async () => {
            if (!event.locode && !event.mmsi && !event.imo && !event.source) {
                return LambdaResponse.badRequest("Need LOCODE, MMSI or IMO");
            }
            if (event.locode && !IdUtils.isValidLOCODE(event.locode)) {
                return LambdaResponse.badRequest(
                    "Invalid LOCODE. LOCODEs must be five characters long and start with 'FI'."
                );
            }
            if (event.mmsi && !IdUtils.isValidMMSI(event.mmsi)) {
                return LambdaResponse.badRequest(
                    "Invalid MMSI. MMSI identifiers must be 9 characters long and between 100000000 and 999999999."
                );
            }
            if (event.imo && !IdUtils.isValidIMO(event.imo)) {
                return LambdaResponse.badRequest(
                    "Invalid IMO. IMO identifiers must be 7 characters long and between 1000000 and 9999999."
                );
            }

            const timestamps = await TimestampsService.findAllTimestamps(
                event.locode,
                event.mmsi,
                event.imo,
                event.source
            );
            return LambdaResponse.okJson(timestamps);
        })
        .catch((error) => {
            logException(logger, error);
            return LambdaResponse.internalError();
        });
};
