import {withDbSecret} from "../../../../../common/secrets/dbsecret";
import * as ImageFetcher from "../../service/image-fetcher";

export const KEY_SECRET_ID = 'SECRET_ID';
export const KEY_IMAGE_SERVER_URL = 'mobile_server.url';
export const KEY_IMAGE_SERVER_USERNAME = 'mobile_server.username';
export const KEY_IMAGE_SERVER_PASSWORD = 'mobile_server.password';
export const KEY_IMAGE_SERVER_CERTIFICATE = 'mobile_server.certificate';

export const KEY_BUCKET_NAME = 's3_bucket_name';

const secretId = process.env[KEY_SECRET_ID] as string;
const bucketName = process.env[KEY_BUCKET_NAME] as string;

let imageServerUrl: string;
let imageServerUsername: string;
let imageServerPassword: string;
let imageServerCertificate: string;

export function handlerFn(doWithSecret: (secretId: string, fn: (secret: any) => any) => any) {
    return async (): Promise<void> => {
        if(!imageServerUrl) {
            await doWithSecret(secretId, (secret: any) => {
                imageServerUrl = secret[KEY_IMAGE_SERVER_URL];
                imageServerUsername = secret[KEY_IMAGE_SERVER_USERNAME];
                imageServerPassword = secret[KEY_IMAGE_SERVER_PASSWORD];
                imageServerCertificate = secret[KEY_IMAGE_SERVER_CERTIFICATE];
            });
        }

        console.info("updating images from " + imageServerUrl);

        return await ImageFetcher.updateAllCameras(imageServerUrl, imageServerUsername, imageServerPassword, bucketName, imageServerCertificate);
    };
}

export const handler = handlerFn(withDbSecret);
