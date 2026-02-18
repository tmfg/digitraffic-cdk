import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import pLimit from "p-limit";
import * as ImageStore from "./image-store.js";
import * as MetadataService from "./metadata.js";
import { Session } from "./session.js";

export const CAMERA_GROUP_ID = "Saimaa";

const updateLimit = pLimit(5);

export async function updateAllCameras(
  url: string,
  username: string,
  password: string,
  bucketName: string,
  certificate: string,
  ca: string,
  hostname: string,
): Promise<void> {
  const cameraIds =
    await MetadataService.getAllCameraIdsForGroup(CAMERA_GROUP_ID);
  const session = await loginToCameraServer(
    url,
    username,
    password,
    certificate,
    ca,
    hostname,
  );

  return updateAllImages(cameraIds, session, bucketName);
}

async function updateAllImages(
  cameraIds: string[],
  session: Session,
  bucketName: string,
): Promise<void> {
  const updatedCameras = [] as string[];

  await Promise.allSettled(
    cameraIds.map(async (cameraId) =>
      updateLimit(async () => {
        const image = await getImageFromCamera(session, cameraId);

        if (!image) {
          logger.info({
            method: "ImageFetcher.updateAllImages",
            message: `empty picture from camera ${cameraId}`,
          });
        } else {
          updatedCameras.push(cameraId);
          return ImageStore.storeImage(cameraId, image, bucketName);
        }

        return Promise.resolve();
      }),
    ),
  );

  await session.disconnect();

  return MetadataService.updateMetadataUpdated(updatedCameras, new Date());
}

async function loginToCameraServer(
  url: string,
  username: string,
  password: string,
  certificate: string,
  ca: string,
  hostname: string,
): Promise<Session> {
  const session = new Session(url, certificate, ca, hostname);
  await session.connect();
  await session.login(username, password);

  return session;
}

async function getImageFromCamera(
  session: Session,
  cameraId: string,
): Promise<string | undefined> {
  // to get image, we need to request stream, rewind stream to current time and then request on frame from the stream
  // of course close stream after
  const videoId = await session.requestStream(cameraId);
  await session.setStreamTime(videoId);
  const image = await session.getFrameFromStream(videoId);

  await session.closeStream(videoId);

  return image;
}
