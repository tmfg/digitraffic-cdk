import { ResponseChecker, UrlChecker } from "@digitraffic/common/dist/aws/infra/canaries/url-checker";
import assert from "assert";
import { Camera } from "../model/camera";

const METADATA_IBNET_URL = "/prod/api/marinecam/ibnet/metadata";
const CAMERA_IBNET_URL = "/prod/api/marinecam/ibnet/1305f095-4338-4f16-bbcf-b4a7a2a38abc.jpg";

const METADATA_CAMERAS_URL = "/prod/api/marinecam/cameras/metadata";
const CAMERA_CAMERAS_URL = "/prod/api/marinecam/cameras/1305f095-4338-4f16-bbcf-b4a7a2a38abc.jpg";

export const handler: () => Promise<string> = async () => {
    const checker = await UrlChecker.createV2();
    const jsonChecker = ResponseChecker.forJson();
    const imageChecker = ResponseChecker.forJpeg();

    // ibnet-urls
    await checker.expect200(
        METADATA_IBNET_URL,
        jsonChecker.checkJson((cameras: Camera[]) => {
            assert.ok(cameras.length > 1);
            assert.ok(cameras[0].id.length > 0);
        })
    );
    await checker.expect403WithoutApiKey(METADATA_IBNET_URL);

    await checker.expect200(CAMERA_IBNET_URL, imageChecker.check());
    await checker.expect403WithoutApiKey(CAMERA_IBNET_URL);

    // cameras-urls
    await checker.expect200(
        METADATA_CAMERAS_URL,
        jsonChecker.checkJson((cameras: Camera[]) => {
            assert.ok(cameras.length > 1);
            assert.ok(cameras[0].id.length > 0);
        })
    );
    await checker.expect403WithoutApiKey(METADATA_CAMERAS_URL);

    await checker.expect200(CAMERA_CAMERAS_URL, imageChecker.check());
    await checker.expect403WithoutApiKey(CAMERA_CAMERAS_URL);

    return checker.done();
};
