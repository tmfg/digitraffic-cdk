import {EpcMessage} from "../../lib/model/epcmessage";
import * as EpcMessageService from "../../lib/service/epcmessage";
import moment from 'moment';

describe('epcmessage service', () => {

    test('createEpcMessageResponse', () => {
        const epcMessage: EpcMessage = {
            EPCMessage: {
                EPCMessageHeader: [{
                    ShipMessageId: '1'
                }]
            }
        };

        const resp = EpcMessageService.createEpcMessageResponse(epcMessage, date);

        expect(resp).toBe(expectedResponse);
    });

    test('isValidEpcMessage - valid', () => {
        expect(EpcMessageService.isValidEpcMessage({
            EPCMessage: {
                EPCMessageHeader: [{
                    ShipMessageId: '1'
                }]
            }
        })).toBe(true);
    });

    test('isValidEpcMessage - missing EPCMessage', () => {
        expect(EpcMessageService.isValidEpcMessage({})).toBe(false);
    });

    test('isValidEpcMessage - missing EPCMessageHeader', () => {
        expect(EpcMessageService.isValidEpcMessage({
            EPCMessage: {}
        })).toBe(false);
    });

    test('isValidEpcMessage - empty EPCMessageHeader', () => {
        expect(EpcMessageService.isValidEpcMessage({
            EPCMessage: {
                EPCMessageHeader: []
            }
        })).toBe(false);
    });

    test('isValidEpcMessage - missing ShipMessageId', () => {
        expect(EpcMessageService.isValidEpcMessage({
            EPCMessage: {
                EPCMessageHeader: [{}]
            }
        })).toBe(false);
    });

    test('isValidEpcMessage - nullish ShipMessageId', () => {
        expect(EpcMessageService.isValidEpcMessage({
            EPCMessage: {
                EPCMessageHeader: [{
                    ShipMessageId: undefined
                }]
            }
        })).toBe(false);
    });

});

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
</EPCMessage>
`.trim();
