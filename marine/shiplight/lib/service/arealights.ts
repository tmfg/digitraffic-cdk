import {AreaLightsApi} from "../api/arealights";
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
        console.info('method=updateLightsForArea area %d, duration %d, visibility %d',
            areaTraffic.areaId,
            areaTraffic.durationInMinutes,
            areaTraffic.visibilityInMetres);
        // TODO disabled as API doesn't yet exist
        //await this.api.updateLightsForArea(areaTraffic);
    }
}
