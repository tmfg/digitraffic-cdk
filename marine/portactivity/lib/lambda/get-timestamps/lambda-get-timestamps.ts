import {findAllTimestamps} from "../../service/timestamps";

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
    return await findAllTimestamps(event.locode, event.mmsi, event.imo);
};
