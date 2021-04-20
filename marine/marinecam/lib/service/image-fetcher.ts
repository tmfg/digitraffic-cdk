import {Session} from "./session";
import * as ImageStore from "./image-store";
import * as MetadataService from './metadata';

export async function updateAllCameras(url: string, username: string, password: string, bucketName: string, certificate: string) {
    const cameraIds = await MetadataService.getAllCameraIds();
    const session = await loginToCameraServer(url, username, password, certificate);

    return await updateAllImages(cameraIds, session, bucketName);
}

async function updateAllImages(cameraIds: string[], session: Session, bucketName: string): Promise<any> {
    return await Promise.allSettled(cameraIds.map(cameraId => {
        return getCameraThumbnail(session, cameraId)
            .then(thumbnail => ImageStore.storeImage(cameraId, thumbnail, bucketName))
            .then(_ => MetadataService.updateMetadataUpdated(cameraId, new Date()));
    }));
}

async function loginToCameraServer(url: string, username: string, password: string, certificate: string): Promise<Session> {
    const session = new Session(url, true, certificate);
    await session.connect();
    await session.login(username, password);

    //console.info(JSON.stringify(await session.getAllViewsAndCameras(), null, 2));

    return session;
}

async function getCameraThumbnail(session: Session, cameraId: string): Promise<string> {
    const videoId = await session.startStream(cameraId);
    const thumbnail = await session.getThumbnail(cameraId);
    await session.closeStream(videoId);

    return thumbnail;
}