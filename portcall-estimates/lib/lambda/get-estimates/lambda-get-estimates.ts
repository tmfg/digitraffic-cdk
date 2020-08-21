import {findAllEstimates} from "../../service/estimates";

export const handler = async (
    event: {
        locode?: string,
        mmsi?: string,
        imo?: string
    }
): Promise<any> => {
    return await findAllEstimates(event.locode, event.mmsi, event.imo);
};
