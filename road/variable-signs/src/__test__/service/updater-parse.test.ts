import * as Datex2UpdateService from "../../service/datex2-update-service.js";
import { TEST_DATEX2, TEST_DATEX2_2 } from "./service-test-constants.js";

describe("updater-parse-tests", () => {
    test("parse_empty", () => {
        const situations = Datex2UpdateService.parseSituations("");

        expect(situations.length).toEqual(0);
    });

    test("parse_1", () => {
        const situations = Datex2UpdateService.parseSituations(TEST_DATEX2);

        expect(situations.length).toEqual(2);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        expect(situations[0]!.id).toEqual("KRM043951");
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        expect(situations[1]!.id).toEqual("KRM044051");
    });

    test("parse_2", () => {
        const situations = Datex2UpdateService.parseSituations(TEST_DATEX2_2);

        expect(situations.length).toEqual(2);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        expect(situations[0]!.id).toEqual("KRM01");
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        expect(situations[1]!.id).toEqual("KRM02");
    });
});
