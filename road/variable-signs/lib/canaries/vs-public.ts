import {ContentTypeChecker, UrlChecker} from "digitraffic-common/aws/infra/canaries/url-checker";
import {MediaType} from "digitraffic-common/aws/types/mediatypes";

const BASE_URL = "/prod/api/v1/variable-signs/";
const IMAGES_URL = BASE_URL + "images/";
const DATEX2_URL2= BASE_URL + "datex2";

const IMAGES_VALID_URL = IMAGES_URL + "42";
const IMAGES_INVALID_URL = IMAGES_URL + "error";

export const handler = async () => {
    const checker = await UrlChecker.createV2();

    // check datex2
    await checker.expect403WithoutApiKey(DATEX2_URL2);
    await checker.expect200(DATEX2_URL2, ContentTypeChecker.checkContentType(MediaType.APPLICATION_XML));

    // check valid image
    await checker.expect403WithoutApiKey(IMAGES_VALID_URL);
    await checker.expect200(IMAGES_VALID_URL, ContentTypeChecker.checkContentType(MediaType.IMAGE_SVG));

    // check invalid image
    await checker.expect403WithoutApiKey(IMAGES_INVALID_URL);
    await checker.expect400(IMAGES_INVALID_URL);

    return checker.done();
};