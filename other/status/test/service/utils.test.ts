import * as Utils from "../../lib/service/utils";
import { TrafficType } from "@digitraffic/common/dist/types/traffictype";

describe("UtilsTest", () => {
    test("removeAppAndTrim", () => {
        expect(Utils.removeAppAndTrim(`Last Updated`)).toEqual("Last Updated");
        for (const appName of [TrafficType.ROAD, TrafficType.MARINE, TrafficType.RAIL]) {
            expect(Utils.removeAppAndTrim(`${appName} Last Updated`)).toEqual("Last Updated");
            expect(Utils.removeAppAndTrim(`${appName} /api/foo/v1/bar`)).toEqual("/api/foo/v1/bar");
            expect(Utils.removeAppAndTrim(`${appName.toLowerCase()}/api/foo/v1/bar`)).toEqual(
                "/api/foo/v1/bar"
            );
            expect(Utils.removeAppAndTrim(`/${appName.toLowerCase()}/api/foo/v1/bar`)).toEqual(
                "/api/foo/v1/bar"
            );
            expect(Utils.removeAppAndTrim(`${appName}/api/foo/v1/bar`)).toEqual("/api/foo/v1/bar");
            expect(Utils.removeAppAndTrim(`/${appName}/api/foo/v1/bar`)).toEqual("/api/foo/v1/bar");
        }
    });
});
