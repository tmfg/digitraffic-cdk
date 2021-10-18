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
        await this.api.updateLightsForArea(areaTraffic);
    }
}
