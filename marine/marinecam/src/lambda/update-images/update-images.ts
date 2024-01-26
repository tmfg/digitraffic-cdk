import * as ImageFetcher from "../../service/image-fetcher.js";
import { MarinecamEnvKeys } from "../../keys.js";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import type { MarinecamSecret } from "../../model/secret.js";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { logException } from "@digitraffic/common/dist/utils/logging";

const rdsHolder = RdsHolder.create();
const secretHolder = SecretHolder.create<MarinecamSecret>("mobile_server");
const bucketName = getEnvVariable(MarinecamEnvKeys.BUCKET_NAME);

export const handler: () => Promise<void> = () => {
    return rdsHolder
        .setCredentials()
        .then(() => secretHolder.get())
        .then((secret: MarinecamSecret) => {
            logger.info({
                method: "UpdateImages.handler",
                message: "updating images from " + secret.url
            });

            return ImageFetcher.updateAllCameras(
                secret.url,
                secret.username,
                secret.password,
                bucketName,
                secret.certificate
            );
        })
        .catch((error: Error) => {
            logException(logger, error);

            return Promise.resolve();
        });
};
