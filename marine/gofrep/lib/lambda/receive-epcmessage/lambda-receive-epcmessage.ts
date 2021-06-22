import * as util from 'util';
import * as xml2js from 'xml2js';
import {BAD_REQUEST_MESSAGE} from "digitraffic-common/api/errors";

export async function handler(event: {body: string}): Promise<string> {
    let epcMessage: object
    try {
        const parseXml = util.promisify(xml2js.parseString);
        epcMessage = (await parseXml(event.body)) as object;
    } catch (error) {
        console.error('UploadVoyagePlan XML parsing failed', error);
        return Promise.reject(BAD_REQUEST_MESSAGE);
    }

    console.info(`method=receiveEpcMessage received message: ${JSON.stringify(epcMessage)}`);
    // TODO implement proxying to final destination

    return Promise.resolve(createEpcMessageResponse());
}

function createEpcMessageResponse() {
    return `
<EPCMessage xmlns="http://www.iso.org/28005-2">
  <EPCMessageHeader xmlns="">
    <SentTime>${new Date().toISOString()}</SentTime>
    <ShipMessageId></ShipMessageId>
    <MessageType>ACK</MessageType>
    <Version></Version>
  </EPCMessageHeader>
  <EPCReceiptBody xmlns="">
    <CurrentPortSecurityLevel>SL1</CurrentPortSecurityLevel>
    <RequestErrorCode></RequestErrorCode>
    <RequestProcessed>true</RequestProcessed>
    <RequestStatus>Accepted</RequestStatus>
    <EPCClearanceStatus>
      <Authority></Authority>
      <RequestStatus>
        <Comment></Comment>
        <Status>Accepted</Status>
      </RequestStatus>
      <UsesSW>true</UsesSW>
    </EPCClearanceStatus>
  </EPCReceiptBody>
</EPCMessage>
    `.trim();
}
