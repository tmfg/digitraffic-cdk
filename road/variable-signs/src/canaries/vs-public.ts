import { ContentTypeChecker, UrlChecker } from "@digitraffic/common/dist/aws/infra/canaries/url-checker";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
//import { APIGatewayClient, GetApiKeyCommand } from "@aws-sdk/client-api-gateway";

const V1_BASE = "/prod/api/variable-sign/v1";
const V1_IMAGES = V1_BASE + "/images";
const V1_DATEX2 = V1_BASE + "/signs.datex2";

/*
export const handler2 = async (): Promise<void> => {
    const client = new APIGatewayClient();
    const command = new GetApiKeyCommand({
        apiKey: "nhfynsv81j",
        includeValue: true,
    });

    const response = await client.send(command);

    console.info("response " + JSON.stringify(response));
}*/

export const handler = async (): Promise<string> => {
    const checker = await UrlChecker.createV2();

    // check datex2 v1
    await checker.expect403WithoutApiKey(V1_DATEX2);
    await checker.expect200(V1_DATEX2, ContentTypeChecker.checkContentType(MediaType.APPLICATION_XML));

    // check valid image v1
    await checker.expect403WithoutApiKey(V1_IMAGES + "/42");
    await checker.expect200(V1_IMAGES + "/42", ContentTypeChecker.checkContentType(MediaType.IMAGE_SVG));

    // check invalid image v§
    await checker.expect403WithoutApiKey(V1_IMAGES + "/error");
    await checker.expect400(V1_IMAGES + "/error");

    return checker.done();
};
