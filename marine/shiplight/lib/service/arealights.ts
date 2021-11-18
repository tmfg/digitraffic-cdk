import {AreaLightsApi, AreaLightsBrightenCommand} from "../api/arealights";
import {AreaTraffic} from "../model/areatraffic";

export class AreaLightsService {

    private readonly api: AreaLightsApi;

    constructor(api: AreaLightsApi) {
        this.api = api;
    }

    /**
     * Updates visibility for lights in an area.
     * @param areaTraffic
     */
    async updateLightsForArea(areaTraffic: AreaTraffic): Promise<void> {
        // TODO hardcoded areaId for testing
        const areaId = 10; // areaTraffic.areaId
        console.info('method=updateLightsForArea area %d, duration %d, visibility %d',
            areaId,
            areaTraffic.durationInMinutes,
            areaTraffic.visibilityInMeters);
        await this.api.updateLightsForArea({
            routeId: areaId,
            command: AreaLightsBrightenCommand.MAX, // no need for other levels for now
            tempTime: areaTraffic.durationInMinutes
        });
    }
}
