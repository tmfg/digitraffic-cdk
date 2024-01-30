import type { FeatureCollection } from "geojson";
import { Language } from "@digitraffic/common/dist/types/language";
import { jest } from "@jest/globals";

const EMPTY_FEATURECOLLECTION_EN: FeatureCollection = {
    features: [],
    type: "FeatureCollection"
};

const EMPTY_FEATURECOLLECTION_FI: FeatureCollection = {
    features: [
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: []
            },
            properties: []
        }
    ],
    type: "FeatureCollection"
};

jest.unstable_mockModule("../../service/faults.js", () => ({
    findAllFaults: jest.fn((language: Language) => {
        if (language === Language.FI) {
            return Promise.resolve([EMPTY_FEATURECOLLECTION_FI, new Date()]);
        }

        return Promise.resolve([EMPTY_FEATURECOLLECTION_EN, new Date()]);
    })
}));

// eslint-disable-next-line dot-notation
process.env["SECRET_ID"] = "";

import { decodeBase64ToAscii } from "@digitraffic/common/dist/utils/base64";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";

jest.spyOn(ProxyHolder.prototype, "setCredentials").mockImplementation(() => Promise.resolve());

describe("get-faults", () => {
    async function expectResponse<T>(
        language: string,
        fixed_in_hours: string,
        status: number,
        expected?: T
    ): Promise<void> {
        const { handler } = await import("../../lambda/get-faults/get-faults.js");
        const { findAllFaults } = await import("../../service/faults.js");
        const response = await handler({ language, fixed_in_hours });

        //console.info("response %s", JSON.stringify(response, null, 2));
        //console.info("body %s", decodeBase64ToAscii(response.body));

        expect(response.status).toEqual(status);

        if(status === 200) {
            expect(findAllFaults).toHaveBeenCalled();
        }
        
        if (expected) {
            const value: T = JSON.parse(decodeBase64ToAscii(response.body)) as unknown as T;
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
