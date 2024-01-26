import { type AreaVisibilityApi } from "../api/areavisibility.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

interface AreaVisibilityWrapper {
    readonly visibilityInMeters: number | undefined;
}

export class AreaVisibilityService {
    private readonly api: AreaVisibilityApi;

    constructor(api: AreaVisibilityApi) {
        this.api = api;
    }

    /**
     * Gets visibility for an area.
     *
     * TODO The area id is currently ignored since only one area is used
     * and no mapping from movement area to visibility area exists.
     * @param areaId Area id
     * @return Visibility for area in metres
     */
    async getVisibilityForAreaInMetres(areaId: number): Promise<AreaVisibilityWrapper> {
        try {
            const resp = await this.api.getVisibilityForArea("vaylavisi139");

            logger.info({
                method: "AreavisibilityService.getVisibilityForAreaInMetres",
                message: `got visibility ${resp.visibilityInMeters} for area ${areaId}`,
                customLastUpdated: resp.lastUpdated
            });

            return { visibilityInMeters: resp.visibilityInMeters };
        } catch (error) {
            // error logged at API level
            return { visibilityInMeters: undefined };
        }
    }
}
