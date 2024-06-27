import {
    dbTestBase,
    decodeBodyToObject,
    getLambdaInputAuthorizerEvent,
    prettyJson,
    setTestEnv
} from "../../db-testutil";
setTestEnv();
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { ChargingNetworkKeys } from "../../../lib/keys";
import { handler } from "../../../lib/lambda/get-ocpi-emsp-versions/get-ocpi-emsp-versions";
import { DT_CPO_ID } from "../../test-constants";

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
    dbTestBase((db) => {
        test("get-ocpi-emsp-versions", () => {
            const response = handler(getLambdaInputAuthorizerEvent(DT_CPO_ID));
            const body = decodeBodyToObject(response);
            expect(prettyJson(body, ["timestamp"])).toEqual(prettyJson(TEST_VERSIONS, ["timestamp"]));
        });
    })
);
