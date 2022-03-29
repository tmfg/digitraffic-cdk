import * as ImageFetcher from "../../service/image-fetcher";
import {MarinecamEnvKeys} from "../../keys";
import {SecretHolder} from "digitraffic-common/aws/runtime/secrets/secret-holder";
import {MarinecamSecret} from "../../model/secret";

const secretHolder = SecretHolder.create<MarinecamSecret>('mobile_server');
const bucketName = process.env[MarinecamEnvKeys.BUCKET_NAME] as string;

export const handler = async () => {
    return secretHolder.setDatabaseCredentials()
        .then(() => secretHolder.get())
        .then((secret: MarinecamSecret) => {
            console.info("updating images from " + secret.url);

            return ImageFetcher.updateAllCameras(
                secret.url, secret.username, secret.password, bucketName, secret.certificate,
            );
        })
        .catch(error => {
            console.log("updateAllCameras failed with %s", error);

            return Promise.resolve();
        });
};
