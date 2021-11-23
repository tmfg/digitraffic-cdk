import {ResponseChecker, UrlChecker} from "digitraffic-common/canaries/url-checker";
import assert from "assert";
import {MediaType} from "digitraffic-common/api/mediatypes";
import {Camera} from "../model/camera";

const hostname = process.env.hostname as string;
const apiKeyId = process.env.apiKeyId as string;

const METADATA_URL = "/prod/api/marinecam/ibnet/metadata";
const CAMERA_URL = "/prod/api/marinecam/ibnet/1305f095-4338-4f16-bbcf-b4a7a2a38abc.jpg";

export const handler = async () => {
    const checker = await UrlChecker.create(hostname, apiKeyId);
    const jsonChecker = ResponseChecker.forJson();
    const imageChecker = ResponseChecker.forJpeg();

    await checker.expect200(METADATA_URL, jsonChecker.checkJson((json: Camera[]) => {
        assert.ok(json.length > 1);
        assert.ok(json[0].id !== null);
    }));
    await checker.expect403WithoutApiKey(METADATA_URL, MediaType.APPLICATION_JSON);

    await checker.expect200(CAMERA_URL, imageChecker.check());
    await checker.expect403WithoutApiKey(CAMERA_URL, MediaType.APPLICATION_JSON);

    return checker.done();
}
