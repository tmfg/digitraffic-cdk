import { IbnetApi } from "../api/ibnet-api.js";
import { updateActivities } from "./activity-updater.js";
import { updateLocations } from "./location-updater.js";
import { updateRestrictions } from "./restriction-updater.js";
import { updateSources } from "./source-updater.js";
import { updateVessels } from "./vessel-updater.js";

const baseUrl = "TODO";
const authHeaderValue = "TODO";

export async function update(): Promise<void> {
    const api = new IbnetApi(baseUrl, authHeaderValue);
    const to = await api.getCurrentVersion();

    //    await updateLocations(api, 0, to);
    //  await updateRestrictions(api, 0, to);
    //    await updateVessels(api, 0, to);
    await updateActivities(api, 0, to);
    await updateSources(api, 0, to);
}
