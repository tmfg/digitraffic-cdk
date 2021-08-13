import * as TimestampsService from "../../service/timestamps";
import {withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {BAD_REQUEST_MESSAGE} from "digitraffic-common/api/errors";

export const handler = async (event: GetTimeStampsEvent): Promise<any> => {
    return handlerFn(event, withDbSecret);
};

export async function handlerFn(
    event: GetTimeStampsEvent,
    withDbSecretFn: (secretId: string, fn: (_: any) => Promise<void>) => Promise<any>): Promise<any> {

    return withDbSecretFn(process.env.SECRET_ID as string, (_: any): Promise<any> => {
        if (!event.locode && !event.mmsi && !event.imo && !event.source) {
            console.warn(`method=handlerGetTimestamps bad request params=${JSON.stringify(event)}`);
            return Promise.reject(BAD_REQUEST_MESSAGE);
        }
        return TimestampsService.findAllTimestamps(event.locode, event.mmsi, event.imo, event.source);
    });
}

type GetTimeStampsEvent = {
    readonly locode?: string
    readonly mmsi?: number
    readonly imo?: number
    readonly source?: string
}
