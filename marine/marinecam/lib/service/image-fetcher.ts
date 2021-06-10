import {Session} from "./session";
import * as ImageStore from "./image-store";
import * as MetadataService from './metadata';

export const CAMERA_GROUP_ID = 'Saimaa';

export async function updateAllCameras(url: string, username: string, password: string, bucketName: string, certificate: string): Promise<any> {
    const cameraIds = await MetadataService.getAllCameraIdsForGroup(CAMERA_GROUP_ID);
    const session = await loginToCameraServer(url, username, password, certificate);

    return updateAllImages(cameraIds, session, bucketName);
}

async function updateAllImages(cameraIds: string[], session: Session, bucketName: string): Promise<any> {
    const updatedCameras = [] as string[];

    await Promise.allSettled(cameraIds.map(async cameraId => {
        const image = await getImageFromCamera(session, cameraId);

        if(!image) {
            console.info("empty picture from camera " + cameraId);
        } else {
            updatedCameras.push(cameraId);
            return ImageStore.storeImage(cameraId, image, bucketName);
        }

        return Promise.resolve();
    }));

    return MetadataService.updateMetadataUpdated(updatedCameras, new Date());
}

async function loginToCameraServer(url: string, username: string, password: string, certificate: string): Promise<Session> {
    const session = new Session(url, false, certificate);
    await session.connect();
    await session.login(username, password);

    return session;
}

async function getImageFromCamera(session: Session, cameraId: string): Promise<string|null> {
    // to get image, we need to request stream, rewind stream to current time and then request on frame from the stream
    // of course close stream after
    const videoId = await session.requestStream(cameraId);
    await session.setStreamTime(videoId);
    const image = await session.getFrameFromStream(videoId);

    await session.closeStream(videoId);

    return image;
}
