import {AreaLightsService} from "../../lib/service/arealights";
import {AreaLightsApi} from "../../lib/api/arealights";
import {AreaTraffic} from "../../lib/model/areatraffic";
import * as sinon from "sinon";

describe('arealights service', () => {

    afterEach(() => sinon.verifyAndRestore());

    test('updateLightsForArea - calls API', async () => {
        const api = createApi();
        const service = new AreaLightsService(api);
        const areaTraffic = createAreaTraffic();
        const updateLightsForAreaStub =
            sinon.stub(AreaLightsApi.prototype, 'updateLightsForArea').returns(Promise.resolve({
                LightsSetSentFailed: [],
                LightsSetSentSuccessfully: [],
            }));

        await service.updateLightsForArea(areaTraffic);

        expect(updateLightsForAreaStub.calledWith(sinon.match({
            routeId: areaTraffic.areaId,
            visibility: areaTraffic.visibilityInMeters,
            time: areaTraffic.durationInMinutes,
        }))).toBe(true);
    });

    test('updateLightsForArea - retry on error', async () => {
        const api = createApi();
        const service = new AreaLightsService(api);
        const areaTraffic = createAreaTraffic();
        const updateLightsForAreaStub = sinon.stub(AreaLightsApi.prototype, 'updateLightsForArea');
        updateLightsForAreaStub.onFirstCall().callsFake(() => Promise.reject());
        updateLightsForAreaStub.onSecondCall().returns(Promise.resolve({
            LightsSetSentFailed: [],
            LightsSetSentSuccessfully: [],
        }));

        await service.updateLightsForArea(areaTraffic);

        const matcher = sinon.match({
            routeId: areaTraffic.areaId,
            visibility: areaTraffic.visibilityInMeters,
            time: areaTraffic.durationInMinutes,
        });
        expect(updateLightsForAreaStub.callCount).toBe(2);
        expect(updateLightsForAreaStub.getCall(0).calledWith(matcher)).toBe(true);
        expect(updateLightsForAreaStub.getCall(1).calledWith(matcher)).toBe(true);
    });

    function createApi(): AreaLightsApi {
        return new AreaLightsApi('', '');
    }

    function createAreaTraffic(): AreaTraffic {
        return {
            areaId: 10,
            durationInMinutes: 45,
            visibilityInMeters: 5000,
        };
    }
});