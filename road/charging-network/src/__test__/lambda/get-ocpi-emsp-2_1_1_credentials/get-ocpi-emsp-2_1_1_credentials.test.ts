import { dbTestBase, insertOcpiCpo } from "../../db-test-util.js";
import {
    CPO_NAME,
    CPO_TOKEN_A,
    CPO_VERSIONS_ENPOINT,
    decodeBodyToObject,
    DT_CPO_ID,
    getLambdaInputAuthorizerEvent,
    mockProxyAndSecretHolder,
    prettyJson,
    setTestEnv
} from "../../test-util.js";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { type OcpiErrorResponse, StatusCode } from "../../../api/ocpi/ocpi-api-responses.js";
import { ChargingNetworkKeys } from "../../../keys.js";
import { afterEach, jest } from "@jest/globals";

setTestEnv();
const { handler } = await import(
    "../../../lambda/get-ocpi-emsp-2_1_1-credentials/get-ocpi-emsp-2_1_1-credentials.js"
);

describe(
    "lambda-get-ocpi-emsp-2_1_1_credentials-test",

    dbTestBase((db) => {
        beforeEach(() => {
            mockProxyAndSecretHolder();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        test("get-ocpi-emsp-2_1_1_credentials", async () => {
            await insertOcpiCpo(
                db,
                DT_CPO_ID,
                CPO_NAME,
                CPO_TOKEN_A,
                "CPO_TOKEN_B",
                "CPO_TOKEN_C",
                CPO_VERSIONS_ENPOINT
            );
            const response = await handler(getLambdaInputAuthorizerEvent(DT_CPO_ID));
            const body = decodeBodyToObject(response);
            console.info(prettyJson(body));
            expect(prettyJson(body, ["timestamp"])).toEqual(prettyJson(getExpectedJson(), ["timestamp"]));
        });

        test("get-ocpi-emsp-2_1_1_credentials-no-cpo", async () => {
            await insertOcpiCpo(
                db,
                DT_CPO_ID,
                CPO_NAME,
                CPO_TOKEN_A,
                "CPO_TOKEN_B",
                "CPO_TOKEN_C",
                CPO_VERSIONS_ENPOINT
            );
            const response = await handler(getLambdaInputAuthorizerEvent(undefined));
            const body = decodeBodyToObject(response) as OcpiErrorResponse;
            console.info(prettyJson(body));
            expect(body.status_code).toEqual(StatusCode.errorClientMissingParameters);
            expect(response.status).toEqual(400);
        });
    })
);

function getExpectedJson(): string {
    return JSON.stringify({
        type: "Success",
        status_code: 1000,
        status_message: "Success",
        timestamp: "${new Date().toISOString()}",
        data: {
            business_details: {
                name: "Digitraffic test",
                website: "https://www.digitraffic.fi/"
            },
            country_code: "FI",
            party_id: "DTT",
            token: "CPO_TOKEN_B",
            url: `${getEnvVariable(ChargingNetworkKeys.OCPI_DOMAIN_URL)}/ocpi/emsp/versions/`
        }
    });
}
