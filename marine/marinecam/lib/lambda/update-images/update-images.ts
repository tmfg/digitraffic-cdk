import * as ImageFetcher from "../../service/image-fetcher";
import { MarinecamEnvKeys } from "../../keys";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { MarinecamSecret } from "../../model/secret";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import { envValue } from "@digitraffic/common/dist/aws/runtime/environment";

const rdsHolder = RdsHolder.create();
const secretHolder = SecretHolder.create<MarinecamSecret>("mobile_server");
const bucketName = envValue(MarinecamEnvKeys.BUCKET_NAME);

export const handler = () => {
    return rdsHolder
        .setCredentials()
        .then(() => secretHolder.get())
        .then((secret: MarinecamSecret) => {
            console.info("updating images from %s", secret.url);

            return ImageFetcher.updateAllCameras(
                secret.url,
                secret.username,
                secret.password,
                bucketName,
                secret.certificate
            );
        })
        .catch((error: Error) => {
            console.log("updateAllCameras failed with %s", error);

            return Promise.resolve();
        });
};
