import type { EpcMessage } from "../model/epcmessage.js";
import type { EpcMessageResponse } from "../model/epcmessage_response.js";

export function createEpcMessageResponse(
  _epcMessage: EpcMessage,
  date: Date,
): EpcMessageResponse {
  const dateStr = date.toISOString().slice(0, -5) + "Z"; // remove millis
  return {
    EPCMessageHeader: {
      SentTime: dateStr,
      MessageType: 0,
      Version: "",
    },
  };
}
