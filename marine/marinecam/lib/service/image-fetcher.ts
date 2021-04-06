import {Session} from "./session";
import {storeImage} from "./image-store";

const CAMERA_ID_LIST = ['bccf67f3-bec3-4716-aa28-63f3b7c187d8', 'd4d56ee5-6241-47d2-a3a7-cbca2792ec72'];

export async function updateAllCameras(url: string, username: string, password: string) {
    const session = new Session(url, true);

    await session.connect();
    await session.login(username, password);
    //console.info(JSON.stringify(await session.getAllViewsAndCameras(), null, 2));

    await Promise.allSettled(CAMERA_ID_LIST.map(async cameraId => {
        const thumbnail = await session.getThumbnail(cameraId);

        return storeImage(cameraId, thumbnail);
    }));
}