import {getDisruptions} from "../../api/get-disruptions";
import {saveDisruptions} from "../../service/disruptions";

export const handler = async () : Promise <any> => {
    const newDisruptions = await getDisruptions(process.env.ENDPOINT_URL as string);
    await saveDisruptions(newDisruptions);
};
