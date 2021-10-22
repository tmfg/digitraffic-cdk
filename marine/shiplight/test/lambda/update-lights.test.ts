import {IDatabase} from "pg-promise";
import {handlerFn} from "../../lib/lambda/update-lights/update-lights";
import {assertArea, dbTestBase, insertAreaTraffic, insertVessel, insertVesselLocation} from "../db-testutil";
import {createSecretFunction} from "digitraffic-common/test/secret";
import {ShipTypes} from "../../lib/db/areatraffic";
import {ShiplightSecret} from "../../lib/model/shiplight-secret";
import * as sinon from "sinon";
import {AreaVisibilityService} from "../../lib/service/areavisibility";
import {AreaVisibilityApi} from "../../lib/api/areavisibility";
import {AreaLightsApi} from "../../lib/api/arealights";
import {AreaLightsService} from "../../lib/service/arealights";

const secret: ShiplightSecret = {
    lightsControlEndpointUrl: 'test',
    lightsControlApiKey: 'test',
    visibilityEndpointUrl: 'test',
    visibilityApiKey: 'test'
};

describe('update-lights', dbTestBase((db: IDatabase<any, any>) => {

    afterEach(() => sinon.verifyAndRestore());

    test('no areas', async () => {
        await handlerFn(createSecretFunction(secret), AreaVisibilityService, AreaLightsService);
    });

    test('update lights with visibility', async () => {
        const durationInMinutes = 12;
        const areaId = 4;
        const visibilityInMetres = 1000;
        const getVisibilityForAreaStub =
            sinon.stub(AreaVisibilityApi.prototype, 'getVisibilityForArea').returns(Promise.resolve({
                lastUpdated: new Date().toISOString(),
                visibilityInMetres
            }));
        const updateLightsForAreaStub =
            sinon.stub(AreaLightsApi.prototype, 'updateLightsForArea').returns(Promise.resolve());
        await insertAreaTraffic(db, areaId, 'testi1', durationInMinutes, "POLYGON((0 0, 10 0, 10 10, 0 10, 0 0))");
        await insertVessel(db, 1, ShipTypes.CARGO); // CARGO will trigger
        await insertVesselLocation(db, 1, Date.now(), 1); // x = 1, in the polygon

        await handlerFn(createSecretFunction(secret), AreaVisibilityService, AreaLightsService);

        await assertArea(db, areaId, durationInMinutes);
        expect(getVisibilityForAreaStub.calledWith(sinon.match.string)).toBe(true); // exact area id format not known here
        expect(updateLightsForAreaStub.calledWith({
            areaId,
            visibilityInMetres,
            durationInMinutes
        })).toBe(true);
    });

    test('update lights with null visibility on visibility API error', async () => {
        const durationInMinutes = 12;
        const areaId = 4;
        sinon.stub(AreaVisibilityApi.prototype, 'getVisibilityForArea').throws(new Error());
        const updateLightsForAreaStub =
            sinon.stub(AreaLightsApi.prototype, 'updateLightsForArea').returns(Promise.resolve());
        await insertAreaTraffic(db, areaId, 'testi1', durationInMinutes, "POLYGON((0 0, 10 0, 10 10, 0 10, 0 0))");
        await insertVessel(db, 1, ShipTypes.CARGO); // CARGO will trigger
        await insertVesselLocation(db, 1, Date.now(), 1); // x = 1, in the polygon

        await handlerFn(createSecretFunction(secret), AreaVisibilityService, AreaLightsService);

        await assertArea(db, areaId, durationInMinutes);
        expect(updateLightsForAreaStub.calledWith({
            areaId,
            visibilityInMetres: null,
            durationInMinutes
        })).toBe(true);
    });

}));
