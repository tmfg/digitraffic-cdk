import {ContentTypeChecker, UrlChecker} from "digitraffic-common/aws/infra/canaries/url-checker";
import {MediaType} from "digitraffic-common/aws/types/mediatypes";

const BASE_URL = "/prod/api/v1/variable-signs/";
const IMAGES_URL = BASE_URL + "images/";
const DATEX2_URL2= BASE_URL + "datex2";

const V1_BASE = "/prod/api/variable-sign/v1";
const V1_IMAGES = V1_BASE + "/images";
const V1_DATEX2 = V1_BASE + "/signs.datex2";

export const handler = async () => {
    const checker = await UrlChecker.createV2();

    // check datex2
    await checker.expect403WithoutApiKey(DATEX2_URL2);
    await checker.expect200(DATEX2_URL2, ContentTypeChecker.checkContentType(MediaType.APPLICATION_XML));

    // check datex2 v1
    await checker.expect403WithoutApiKey(V1_DATEX2);
    await checker.expect200(V1_DATEX2, ContentTypeChecker.checkContentType(MediaType.APPLICATION_XML));

    // check valid image
    await checker.expect403WithoutApiKey(IMAGES_URL + "42");
    await checker.expect200(IMAGES_URL + "42", ContentTypeChecker.checkContentType(MediaType.IMAGE_SVG));

    // check valid image v1
    await checker.expect403WithoutApiKey(V1_IMAGES + "/42");
    await checker.expect200(V1_IMAGES + "/42", ContentTypeChecker.checkContentType(MediaType.IMAGE_SVG));

    // check invalid image
    await checker.expect403WithoutApiKey(IMAGES_URL + "error");
    await checker.expect400(IMAGES_URL + "error");

    // check invalid image v§
    await checker.expect403WithoutApiKey(V1_IMAGES + "/error");
    await checker.expect400(V1_IMAGES + "/error");

    return checker.done();
};