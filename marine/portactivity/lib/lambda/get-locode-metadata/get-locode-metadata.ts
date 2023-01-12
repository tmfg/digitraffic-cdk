import * as MetadataService from "../../service/metadata";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";

const rdsHolder = RdsHolder.create();

export const handler = () => {
    return rdsHolder
        .setCredentials()
        .then(async () => {
            const locodes = await MetadataService.getLocodesWithPredictions();
            return LambdaResponse.ok(locodes);
        })
        .catch((error) => {
            console.error("method=getLocodeMetadata error", error);
            return LambdaResponse.internalError();
        });
};
