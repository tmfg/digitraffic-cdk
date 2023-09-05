import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { LamHistoryEnvKeys } from "../../keys";

import { TmsHistorySecret } from "../../model/tms-history-secret";
import { handleMetadataUpdate } from "../../service/update";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const bucketName = getEnvVariable(LamHistoryEnvKeys.BUCKET_NAME);
const secretHolder = SecretHolder.create<TmsHistorySecret>("tms-history");

export const handler = async (): Promise<void> => {
    const start = Date.now();

    const secret = await secretHolder.get();

    // Update piste-data
    await handleMetadataUpdate(secret.pisteUrl, secret.snowflakeApikey, bucketName, "pisteet.json");

    // Update pistejoukko-data
    await handleMetadataUpdate(secret.pistejoukkoUrl, secret.snowflakeApikey, bucketName, "pistejoukot.json");

    logger.info({
        method: "TmsHistory.updateLamStations",
        tookMs: Date.now() - start
    });
};
