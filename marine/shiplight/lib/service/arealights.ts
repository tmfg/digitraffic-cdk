import {AreaLightsApi} from "../api/arealights";
import {AreaTraffic} from "../model/areatraffic";
import {retry, RetryLogError} from "digitraffic-common/promise/promise";

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
        console.info(
            'method=updateLightsForArea area %d, duration %d, visibility %d',
            areaId,
            areaTraffic.durationInMinutes,
            areaTraffic.visibilityInMeters,
        );

        await retry(
            async () => {
                const response = await this.api.updateLightsForArea({
                    routeId: areaId,
                    visibility: areaTraffic.visibilityInMeters,
                    time: areaTraffic.durationInMinutes,
                });
                if (response.LightsSetSentFailed.length) {
                    console.error('method=updateLightsForArea LightsSetSentFailed: %s', response.LightsSetSentFailed.join(', '));
                }
            }, 2, RetryLogError.LOG_LAST_RETRY_AS_ERROR_OTHERS_AS_WARNS,
        );
    }
}
