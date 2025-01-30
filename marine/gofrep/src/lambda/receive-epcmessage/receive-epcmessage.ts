import * as EpcMessageService from "../../service/epcmessage.js";
import type { EpcMessage } from "../../model/epcmessage.js";
import type { EpcMessageResponse } from "../../model/epcmessage_response.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export function handler(epcMessage: EpcMessage): string | EpcMessageResponse {
  logger.debug(
    "method=receiveEpcMessage received message: " + JSON.stringify(epcMessage),
  );

  // TODO implement proxying to final destination
  return EpcMessageService.createEpcMessageResponse(epcMessage, new Date());
}
