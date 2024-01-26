process.env["SECRET_ID"] = "TEST";

import {
    assertArea,
    dbTestBase,
    insertAreaTraffic,
    insertVessel,
    insertVesselLocation
} from "../db-testutil.js";
import type { ShiplightSecret } from "../../model/shiplight-secret.js";
import { AreaVisibilityService } from "../../service/areavisibility.js";
import { AreaVisibilityApi } from "../../api/areavisibility.js";
import { AreaLightsApi } from "../../api/arealights.js";
import { AreaLightsService } from "../../service/arealights.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { jest } from "@jest/globals";

const secret: ShiplightSecret = {
    lightsControlEndpointUrl: "test",
    lightsControlApiKey: "test",
    visibilityEndpointUrl: "test",
    visibilityApiKey: "test"
};

jest.spyOn(ProxyHolder.prototype, "setCredentials").mockImplementation(() => Promise.resolve());
jest.spyOn(SecretHolder.prototype, "get").mockImplementation(() => Promise.resolve(secret));

const { handlerFn } = await import("../../lambda/update-lights/update-lights.js");

describe(
    "update-lights",
    dbTestBase((db: DTDatabase) => {
        test("no areas", async () => {
            await handlerFn(AreaVisibilityService, AreaLightsService);
        });

        test("update lights with visibility", async () => {
            const durationInMinutes = 12;
            const areaId = 4;
            const visibilityInMeters = 1000;

            jest.spyOn(AreaVisibilityApi.prototype, "getVisibilityForArea").mockResolvedValue({
                lastUpdated: new Date().toISOString(),
                visibilityInMeters
            });
            jest.spyOn(AreaLightsApi.prototype, "updateLightsForArea").mockResolvedValue({
                LightsSetSentFailed: [],
                LightsSetSentSuccessfully: []
            });
            
            await insertAreaTraffic(
                db,
                areaId,
                "testi1",
                durationInMinutes,
                "POLYGON((0 0, 10 0, 10 10, 0 10, 0 0))"
            );
            await insertVessel(db, 1);
            await insertVesselLocation(db, 1, Date.now(), 1); // x = 1, in the polygon

            await handlerFn(AreaVisibilityService, AreaLightsService);

            await assertArea(db, areaId, durationInMinutes);
        });
    })
);
