import {findAllTimestamps} from "../../service/timestamps";
import {withDbSecret} from "../../../../../common/secrets/dbsecret";

export const handler = async (event: GetTimeStampsEvent): Promise<any> => {
    return handlerFn(event, withDbSecret);
};

export async function handlerFn(
    event: GetTimeStampsEvent,
    withDbSecretFn: (secretId: string, fn: (_: any) => Promise<void>) => Promise<any>): Promise<any> {

    return withDbSecretFn(process.env.SECRET_ID as string, (_: any): Promise<any> => {
        if (!event.locode && !event.mmsi && !event.imo) {
            return Promise.reject('Bad request');
        }
        return findAllTimestamps(event.locode, event.mmsi, event.imo);
    });
}

interface GetTimeStampsEvent {
    locode?: string,
    mmsi?: number,
    imo?: number
}
