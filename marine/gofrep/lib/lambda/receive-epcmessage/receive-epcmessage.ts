import * as EpcMessageService from "../../service/epcmessage";
import { EpcMessage } from "../../model/epcmessage";
import { EpcMessageResponse } from "../../model/epcmessage_response";

export function handler(epcMessage: EpcMessage): string | EpcMessageResponse {
    console.info(
        "DEBUG method=receiveEpcMessage received message: %s",
        JSON.stringify(epcMessage)
    );

    // TODO implement proxying to final destination
    return EpcMessageService.createEpcMessageResponse(epcMessage, new Date());
}
