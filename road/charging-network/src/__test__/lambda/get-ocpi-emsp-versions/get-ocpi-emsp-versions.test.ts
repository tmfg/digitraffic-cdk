import { dbTestBase } from "../../db-test-util.js";
import {
    decodeBodyToObject,
    DT_CPO_ID,
    getLambdaInputAuthorizerEvent,
    prettyJson,
    setTestEnv
} from "../../test-util.js";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { ChargingNetworkKeys } from "../../../keys.js";

setTestEnv();
const { handler } = await import("../../../lambda/get-ocpi-emsp-versions/get-ocpi-emsp-versions.js");
const TEST_VERSIONS = `{
    "type": "Success",
    "status_code": 1000, 
    "status_message": "Success", 
    "timestamp": "2020-01-08T10:24:52Z",
    "data": [ 
        {
            "version": "2.1.1",
            "url": "${getEnvVariable(ChargingNetworkKeys.OCPI_DOMAIN_URL)}/ocpi/emsp/2.1.1/" 
        }
    ]
}`;

describe(
    "lambda-get-ocpi-emsp-versions",
    dbTestBase((_db) => {
        test("get-ocpi-emsp-versions", () => {
            const response = handler(getLambdaInputAuthorizerEvent(DT_CPO_ID));
            const body = decodeBodyToObject(response);
            expect(prettyJson(body, ["timestamp"])).toEqual(prettyJson(TEST_VERSIONS, ["timestamp"]));
        });
    })
);
