import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { LamHistoryEnvKeys } from "../../keys";

import { LamHistorySecret } from "../../model/lam-history-secret";
import { handleMetadataUpdate } from "../../service/update";

const bucketName = getEnvVariable(LamHistoryEnvKeys.BUCKET_NAME);
const secretHolder = SecretHolder.create<LamHistorySecret>("lam-history");

export const handler = async () => {
    const start = Date.now();

    const secret = await secretHolder.get();

    // Update piste-data
    await handleMetadataUpdate(
        secret.pisteUrl,
        secret.apikey,
        bucketName,
        "pisteet.json"
    );

    // Update pistejoukko-data
    await handleMetadataUpdate(
        secret.pistejoukkoUrl,
        secret.apikey,
        bucketName,
        "pistejoukot.json"
    );

    console.info(
        "method=lamHistory.updateMetadata tookMs=%d",
        Date.now() - start
    );
};
