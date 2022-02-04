import {EpcMessage} from "../model/epcmessage";
import {EpcMessageResponse} from "../model/epcmessage_response";

export function createEpcMessageResponse(epcMessage: EpcMessage, date: Date): EpcMessageResponse {
    const dateStr = date.toISOString().slice(0, -5) + 'Z'; // remove millis
    return {
        EPCMessageHeader: {
            SentTime: dateStr,
            MessageType: 0,
            Version: '',
        },
    };
}
