import { FeatureCollection } from "geojson";
import * as FaultsService from "../../lib/service/faults";

process.env.SECRET_ID = "secret";

import { handler } from "../../lib/lambda/get-faults/get-faults";
import { decodeBase64ToAscii } from "@digitraffic/common/dist/utils/base64";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";

jest.spyOn(ProxyHolder.prototype, "setCredentials").mockImplementation(() =>
    Promise.resolve()
);

const EMPTY_FEATURECOLLECTION: FeatureCollection = {
    features: [],
    type: "FeatureCollection",
};

describe("get-faults", () => {
    jest.spyOn(FaultsService, "findAllFaults").mockReturnValue(
        Promise.resolve(EMPTY_FEATURECOLLECTION)
    );

    async function expectResponse<T>(
        event: unknown,
        status: number,
        expected?: T
    ) {
        const response = await handler(event);
        expect(response.status).toEqual(status);

        console.info("response %s", JSON.stringify(response, null, 2));
        console.info("body %s", decodeBase64ToAscii(response.body));

        if (expected) {
            const value: T = JSON.parse(
                decodeBase64ToAscii(response.body)
            ) as unknown as T;
            expect(value).toEqual(expected);
        }
    }

    test("handle - no parameters - default values", async () => {
        await expectResponse({}, 200, EMPTY_FEATURECOLLECTION);
    });

    test("handle - fixed_in_hours 12", async () => {
        await expectResponse(
            { fixed_in_hours: "12" },
            200,
            EMPTY_FEATURECOLLECTION
        );
    });

    test("handle - too big fixed_in_hours", async () => {
        await expectResponse({ fixed_in_hours: "40000" }, 400);
    });

    test("handle - negative fixed_in_hours", async () => {
        await expectResponse({ fixed_in_hours: "-12" }, 400);
    });

    test("handle - fixed_in_hours is not a number", async () => {
        await expectResponse({ fixed_in_hours: "rosebud" }, 400);
    });
});
