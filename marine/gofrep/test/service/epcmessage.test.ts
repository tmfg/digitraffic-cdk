import {EpcMessage} from "../../lib/model/epcmessage";
import {createEpcMessageResponse} from "../../lib/service/epcmessage";
import moment from 'moment';

const dateStr = '2021-07-29T10:20:30Z';
const date = moment(dateStr).toDate();

const expectedResponse = `
<EPCMessage xmlns="http://www.iso.org/28005-2">
  <EPCMessageHeader xmlns="">
    <SentTime>2021-07-29T10:20:30Z</SentTime>
    <ShipMessageId>1</ShipMessageId>
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

describe('epcmessage service', () => {

    test('createEpcMessageResponse', () => {
        const epcMessage: EpcMessage = {
            EPCMessage: {
                EPCMessageHeader: {
                    ShipMessageId: '1'
                }
            }
        };

        const resp = createEpcMessageResponse(epcMessage, date);

        expect(resp).toBe(expectedResponse);
    });

});
