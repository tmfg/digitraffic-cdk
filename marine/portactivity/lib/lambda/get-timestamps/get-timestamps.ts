import * as TimestampsService from "../../service/timestamps";
import {EmptySecretFunction, withDbSecret} from "digitraffic-common/secrets/dbsecret";
import * as IdUtils from 'digitraffic-common/marine/id_utils';
import {LambdaResponse} from "digitraffic-common/lambda/lambda-response";
import {ApiTimestamp} from "../../model/timestamp";

export const handler = (event: GetTimeStampsEvent) => {
    return handlerFn(event, withDbSecret);
};

export function handlerFn(event: GetTimeStampsEvent,
    withDbSecretFn: EmptySecretFunction<LambdaResponse<string | ApiTimestamp[]>>) {
    return withDbSecretFn(process.env.SECRET_ID as string, async () => {
        if (!event.locode && !event.mmsi && !event.imo && !event.source) {
            console.warn('method=getTimeStampsHandler no request params');
            return LambdaResponse.badRequest('Need LOCODE, MMSI or IMO');
        }
        if (event.locode && !IdUtils.isValidLOCODE(event.locode)) {
            console.warn('method=getTimeStampsHandler invalid LOCODE');
            return LambdaResponse.badRequest('Invalid LOCODE. LOCODEs must be five characters long and start with "FI".');
        }
        if (event.mmsi && !IdUtils.isValidMMSI(event.mmsi)) {
            console.warn('method=getTimeStampsHandler invalid MMSI');
            return LambdaResponse.badRequest('Invalid MMSI. MMSI identifiers must be 9 characters long and between 100000000 and 999999999.');
        }
        if (event.imo && !IdUtils.isValidIMO(event.imo)) {
            console.warn('method=getTimeStampsHandler invalid IMO');
            return LambdaResponse.badRequest('Invalid IMO. IMO identifiers must be 7 characters long and between 1000000 and 9999999.');
        }
        try {
            const timestamps = await TimestampsService.findAllTimestamps(event.locode, event.mmsi, event.imo, event.source);
            return LambdaResponse.ok(timestamps);
        } catch (error) {
            console.error('method=getTimeStampsHandler error', error);
            return LambdaResponse.internalError();
        }
    });
}

type GetTimeStampsEvent = {
    readonly locode?: string
    readonly mmsi?: number
    readonly imo?: number
    readonly source?: string
}
