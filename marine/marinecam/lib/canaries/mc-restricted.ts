import {ResponseChecker, UrlChecker} from "digitraffic-common/aws/infra/canaries/url-checker";
import assert from "assert";
import {Camera} from "../model/camera";

const METADATA_URL = "/prod/api/marinecam/ibnet/metadata";
const CAMERA_URL = "/prod/api/marinecam/ibnet/1305f095-4338-4f16-bbcf-b4a7a2a38abc.jpg";

export const handler = async () => {
    const checker = await UrlChecker.createV2();
    const jsonChecker = ResponseChecker.forJson();
    const imageChecker = ResponseChecker.forJpeg();

    await checker.expect200(METADATA_URL, jsonChecker.checkJson((cameras: Camera[]) => {
        assert.ok(cameras.length > 1);
        assert.ok(cameras[0].id !== null);
    }));
    await checker.expect403WithoutApiKey(METADATA_URL);

    await checker.expect200(CAMERA_URL, imageChecker.check());
    await checker.expect403WithoutApiKey(CAMERA_URL);

    return checker.done();
};
