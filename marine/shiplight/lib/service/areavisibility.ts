import {AreaVisibilityApi} from "../api/areavisibility";

type AreaVisibilityWrapper = {
    readonly visibilityInMetres: number | null
}

export class AreaVisibilityService {

    private api: AreaVisibilityApi;

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
            const resp = await this.api.getVisibilityForArea('139');
            console.info(`method=getVisibilityForAreaInMetres areaId: ${areaId} visibility: ${resp.visibilityInMetres} lastUpdated: ${resp.lastUpdated}`);
            return { visibilityInMetres: resp.visibilityInMetres };
        } catch (error) {
            // error logged at API level
            return { visibilityInMetres: null }
        }
    }
}
