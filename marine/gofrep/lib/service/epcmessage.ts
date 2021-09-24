import {EpcMessage} from "../model/epcmessage";

export function isValidEpcMessage(epcMessage: EpcMessage): boolean {
    if (!epcMessage.EPCMessage) {
        console.error('method=isValidEpcMessage missing EPCMessage element');
        return false;
    }
    if (!epcMessage.EPCMessage.EPCMessageHeader?.length) {
        console.error('method=isValidEpcMessage missing EPCMessageHeader element');
        return false;
    }
    if (!epcMessage.EPCMessage.EPCMessageHeader[0].ShipMessageId?.length) {
        console.error('method=isValidEpcMessage missing ShipMessageId');
        return false;
    }
    return true;
}

export function createEpcMessageResponse(epcMessage: EpcMessage, date: Date): string {
    const dateStr = date.toISOString().slice(0,-5) + 'Z'; // remove millis
    return `
<EPCMessage xmlns="http://www.iso.org/28005-2">
  <EPCMessageHeader xmlns="">
    <SentTime>${dateStr}</SentTime>
    <ShipMessageId>${epcMessage.EPCMessage!.EPCMessageHeader![0].ShipMessageId}</ShipMessageId>
    <MessageType>ACK</MessageType>
    <Version></Version>
  </EPCMessageHeader>
</EPCMessage>
`.trim();
}
