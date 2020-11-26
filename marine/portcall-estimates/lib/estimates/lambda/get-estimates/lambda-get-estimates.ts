import {findAllEstimates} from "../../service/estimates";

export const handler = async (
    event: {
        locode?: string,
        mmsi?: number,
        imo?: number
    }
): Promise<any> => {
    if (!event.locode && !event.mmsi && !event.imo) {
        return 'Bad request';
    }
    return await findAllEstimates(event.locode, event.mmsi, event.imo);
};
