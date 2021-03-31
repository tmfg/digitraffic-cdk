import {withDbSecret} from "../../../../../common/secrets/dbsecret";
import {updateAllCameras} from "../../service/image-fetcher";

export const KEY_SECRET_ID = 'SECRET_ID';
export const KEY_IMAGE_SERVER_URL = 'IMAGE_SERVER_URL';
export const KEY_IMAGE_SERVER_USERNAME = 'IMAGE_SERVER_USERNAME';
export const KEY_IMAGE_SERVER_PASSWORD = 'IMAGE_SERVER_PASSWORD';

const secretId = process.env[KEY_SECRET_ID] as string;

let imageServerUrl: string;
let imageServerUsername: string;
let imageServerPassword: string;

export function handlerFn(doWithSecret: (secretId: string, fn: (secret: any) => any) => any) {
    return async (): Promise<void> => {
        if(!imageServerUrl) {
            await doWithSecret(secretId, (secret: any) => {
                imageServerUrl = secret[KEY_IMAGE_SERVER_URL];
                imageServerUsername = secret[KEY_IMAGE_SERVER_USERNAME];
                imageServerPassword = secret[KEY_IMAGE_SERVER_PASSWORD];
            });
        }

        await updateAllCameras(imageServerUrl, imageServerUsername, imageServerPassword);
    };
}

export const handler = handlerFn(withDbSecret);
