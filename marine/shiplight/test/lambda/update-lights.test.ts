process.env.SECRET_ID = "TEST";

import { handlerFn } from "../../lib/lambda/update-lights/update-lights";
import {
    assertArea,
    dbTestBase,
    insertAreaTraffic,
    insertVessel,
    insertVesselLocation
} from "../db-testutil";
import { ShiplightSecret } from "../../lib/model/shiplight-secret";
import * as sinon from "sinon";
import { AreaVisibilityService } from "../../lib/service/areavisibility";
import { AreaVisibilityApi } from "../../lib/api/areavisibility";
import { AreaLightsApi } from "../../lib/api/arealights";
import { AreaLightsService } from "../../lib/service/arealights";
import { DTDatabase } from "@digitraffic/common/dist/database/database";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";

const secret: ShiplightSecret = {
    lightsControlEndpointUrl: "test",
    lightsControlApiKey: "test",
    visibilityEndpointUrl: "test",
    visibilityApiKey: "test"
};

jest.spyOn(ProxyHolder.prototype, "setCredentials").mockImplementation(() => Promise.resolve());
jest.spyOn(SecretHolder.prototype, "get").mockImplementation(() => Promise.resolve(secret));

describe(
    "update-lights",
    dbTestBase((db: DTDatabase) => {
        afterEach(() => sinon.verifyAndRestore());

        test("no areas", async () => {
            await handlerFn(AreaVisibilityService, AreaLightsService);
        });

        test("update lights with visibility", async () => {
            const durationInMinutes = 12;
            const areaId = 4;
            const visibilityInMeters = 1000;
            sinon.stub(AreaVisibilityApi.prototype, "getVisibilityForArea").returns(
                Promise.resolve({
                    lastUpdated: new Date().toISOString(),
                    visibilityInMeters
                })
            );
            sinon.stub(AreaLightsApi.prototype, "updateLightsForArea").returns(
                Promise.resolve({
                    LightsSetSentFailed: [],
                    LightsSetSentSuccessfully: []
                })
            );
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
