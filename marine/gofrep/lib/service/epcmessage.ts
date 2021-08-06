import {EpcMessage} from "../model/epcmessage";

export function createEpcMessageResponse(
    epcMessage: EpcMessage,
    date: Date) {

    const dateStr = date.toISOString().slice(0,-5) + 'Z'; // remove millis

    return `
<EPCMessage xmlns="http://www.iso.org/28005-2">
  <EPCMessageHeader xmlns="">
    <SentTime>${dateStr}</SentTime>
    <ShipMessageId>${epcMessage.EPCMessage.EPCMessageHeader.ShipMessageId}</ShipMessageId>
    <MessageType>ACK</MessageType>
    <Version></Version>
  </EPCMessageHeader>
</EPCMessage>
`.trim();
}
