import { ENV_API_KEY, ENV_HOSTNAME } from "@digitraffic/common/dist/aws/infra/canaries/canary-keys";
import {
    ContentChecker,
    ContentTypeChecker,
    UrlChecker
} from "@digitraffic/common/dist/aws/infra/canaries/url-checker";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { Asserter } from "@digitraffic/common/dist/test/asserter";
import type { PassengerInformationMessage } from "../service/get-message";
import { subHours } from "date-fns";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";

const hostname = getEnvVariable(ENV_HOSTNAME);
const apiKeyId = getEnvVariable(ENV_API_KEY);

const API_URL = "/prod/api/v1/passenger-information";

export const handler = async (): Promise<string> => {
    const checker = await UrlChecker.create(hostname, apiKeyId);

    await checker.expect403WithoutApiKey(API_URL + "/active");

    await checker.expect200(
        API_URL + "/active",
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_JSON),
        ContentChecker.checkJson((json: PassengerInformationMessage[]) => {
            Asserter.assertLengthGreaterThan(json, 0);
            Asserter.assertLengthGreaterThan(
                json.filter((message) => message.creationDateTime >= subHours(Date.now(), 24)),
                0
            );
        })
    );

    await checker.expect200(
        API_URL + "/active?station=HKI",
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_JSON),
        ContentChecker.checkJson((json: PassengerInformationMessage[]) => {
            Asserter.assertEquals(
                json.length,
                json.filter((message) => message.stations?.includes("HKI")).length
            );
        })
    );

    await checker.expect200(
        API_URL + "/active?only_general=true",
        ContentTypeChecker.checkContentType(MediaType.APPLICATION_JSON),
        ContentChecker.checkJson((json: PassengerInformationMessage[]) => {
            Asserter.assertEquals(
                json.length,
                json.filter((message) => message.trainNumber === undefined).length
            );
        })
    );

    return checker.done();
};
