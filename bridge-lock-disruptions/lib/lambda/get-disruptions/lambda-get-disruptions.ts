import {findAllDisruptions, convertFeature} from "../../service/disruptions";
import {createFeatureCollection} from "../../../../common/api/geojson";

export const handler = async (): Promise<any> => {
    const disruptions = await findAllDisruptions();
    return createFeatureCollection(disruptions.disruptions.map(convertFeature), disruptions.lastUpdated);
};
