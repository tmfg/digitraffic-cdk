import {fetchRemoteDisruptions, saveDisruptions} from "../../service/disruptions";

export const handler = async () : Promise <any> => {
    const disruptions = await fetchRemoteDisruptions(process.env.ENDPOINT_URL as string);
    await saveDisruptions(disruptions);
};
