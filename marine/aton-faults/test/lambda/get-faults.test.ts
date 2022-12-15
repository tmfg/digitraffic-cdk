import { FeatureCollection, Position } from "geojson";
import * as FaultsService from "../../lib/service/faults";
import { Language } from "@digitraffic/common/dist/types/language";

process.env.SECRET_ID = "secret";

import { handler } from "../../lib/lambda/get-faults/get-faults";
import { decodeBase64ToAscii } from "@digitraffic/common/dist/utils/base64";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";

jest.spyOn(ProxyHolder.prototype, "setCredentials").mockImplementation(() =>
    Promise.resolve()
);

const EMPTY_FEATURECOLLECTION_EN: FeatureCollection = {
    features: [],
    type: "FeatureCollection",
};

const EMPTY_FEATURECOLLECTION_FI: FeatureCollection = {
    features: [
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [],
            },
            properties: [],
        },
    ],
    type: "FeatureCollection",
};

describe("get-faults", () => {
    jest.spyOn(FaultsService, "findAllFaults").mockImplementation(
        (language: Language, fixed_in_hours: number) => {
            if (language == Language.FI) {
                return Promise.resolve(EMPTY_FEATURECOLLECTION_FI);
            }

            return Promise.resolve(EMPTY_FEATURECOLLECTION_EN);
        }
    );

    async function expectResponse<T>(
        language: string,
        fixed_in_hours: string,
        status: number,
        expected?: T
    ) {
        const response = await handler({ language, fixed_in_hours });

        console.info("response %s", JSON.stringify(response, null, 2));
        console.info("body %s", decodeBase64ToAscii(response.body));

        expect(response.status).toEqual(status);

        if (expected) {
            const value: T = JSON.parse(
                decodeBase64ToAscii(response.body)
            ) as unknown as T;
            expect(value).toEqual(expected);
        }
    }

    test("handle - no parameters - default values", async () => {
        await expectResponse("", "", 200, EMPTY_FEATURECOLLECTION_EN);
    });

    test("handle - fixed_in_hours 12", async () => {
        await expectResponse("", "12", 200, EMPTY_FEATURECOLLECTION_EN);
    });

    test("handle - too big fixed_in_hours", async () => {
        await expectResponse("", "40000", 400);
    });

    test("handle - negative fixed_in_hours", async () => {
        await expectResponse("", "-12", 400);
    });

    test("handle - fixed_in_hours is not a number", async () => {
        await expectResponse("", "rosebud", 400);
    });

    test("handle - language FI", async () => {
        await expectResponse("FI", "", 200, EMPTY_FEATURECOLLECTION_FI);
    });

    test("handle - language XX", async () => {
        await expectResponse("XX", "", 200, EMPTY_FEATURECOLLECTION_EN);
    });
});
