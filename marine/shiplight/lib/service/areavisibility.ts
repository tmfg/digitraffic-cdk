import {AreaVisibilityApi} from "../api/areavisibility";

type AreaVisibilityWrapper = {
    readonly visibilityInMeters: number | null
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
            const resp = await this.api.getVisibilityForArea('vaylavisi139');
            console.info(`method=getVisibilityForAreaInMetres areaId: ${areaId} visibility: ${resp.visibilityInMeters} lastUpdated: ${resp.lastUpdated}`);
            return { visibilityInMeters: resp.visibilityInMeters };
        } catch (error) {
            // error logged at API level
            return { visibilityInMeters: null };
        }
    }
}
