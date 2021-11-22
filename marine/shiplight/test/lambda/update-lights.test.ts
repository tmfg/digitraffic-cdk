import {handlerFn} from "../../lib/lambda/update-lights/update-lights";
import {assertArea, dbTestBase, insertAreaTraffic, insertVessel, insertVesselLocation} from "../db-testutil";
import {createSecretFunction} from "digitraffic-common/test/secret";
import {ShipTypes} from "../../lib/db/areatraffic";
import {ShiplightSecret} from "../../lib/model/shiplight-secret";
import * as sinon from "sinon";
import {AreaVisibilityService} from "../../lib/service/areavisibility";
import {AreaVisibilityApi} from "../../lib/api/areavisibility";
import {AreaLightsApi, AreaLightsBrightenCommand} from "../../lib/api/arealights";
import {AreaLightsService} from "../../lib/service/arealights";
import {DTDatabase} from "digitraffic-common/postgres/database";

const secret: ShiplightSecret = {
    lightsControlEndpointUrl: 'test',
    lightsControlApiKey: 'test',
    visibilityEndpointUrl: 'test',
    visibilityApiKey: 'test'
};

describe('update-lights', dbTestBase((db: DTDatabase) => {

    afterEach(() => sinon.verifyAndRestore());

    test('no areas', async () => {
        await handlerFn(createSecretFunction(secret), AreaVisibilityService, AreaLightsService);
    });

    test('update lights with visibility', async () => {
        const durationInMinutes = 12;
        const areaId = 4;
        const visibilityInMeters = 1000;
        const getVisibilityForAreaStub =
            sinon.stub(AreaVisibilityApi.prototype, 'getVisibilityForArea').returns(Promise.resolve({
                lastUpdated: new Date().toISOString(),
                visibilityInMeters
            }));
        const updateLightsForAreaStub =
            sinon.stub(AreaLightsApi.prototype, 'updateLightsForArea').returns(Promise.resolve({
                LightsSetSentFailed: [],
                LightsSetSentSuccessfully: []
            }));
        await insertAreaTraffic(db, areaId, 'testi1', durationInMinutes, "POLYGON((0 0, 10 0, 10 10, 0 10, 0 0))");
        await insertVessel(db, 1, ShipTypes.CARGO); // CARGO will trigger
        await insertVesselLocation(db, 1, Date.now(), 1); // x = 1, in the polygon

        await handlerFn(createSecretFunction(secret), AreaVisibilityService, AreaLightsService);

        await assertArea(db, areaId, durationInMinutes);
        expect(getVisibilityForAreaStub.calledWith(sinon.match.string)).toBe(true); // exact area id format not known here
        expect(updateLightsForAreaStub.calledWith(sinon.match({
            routeId: 10,
            command: AreaLightsBrightenCommand.MAX,
            tempTime: 12
        }))).toBe(true);
    });

}));
