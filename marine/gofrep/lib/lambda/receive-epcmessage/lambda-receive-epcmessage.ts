import * as util from 'util';
import * as xml2js from 'xml2js';
import {BAD_REQUEST_MESSAGE} from "digitraffic-common/api/errors";
import {EpcMessage} from "../../model/epcmessage";
import * as EpcMessageService from '../../service/epcmessage';

export async function handler(event: {body: string}): Promise<string> {
    let epcMessage: EpcMessage
    try {
        const parseXml = util.promisify(xml2js.parseString);
        epcMessage = (await parseXml(event.body)) as EpcMessage;
    } catch (error) {
        console.error('method=receiveEpcMessage XML parsing failed', error);
        return Promise.reject(BAD_REQUEST_MESSAGE);
    }

    console.info(`method=receiveEpcMessage received message: ${JSON.stringify(epcMessage)}`);
    // TODO implement proxying to final destination

    if (EpcMessageService.isValidEpcMessage(epcMessage)) {
        return EpcMessageService.createEpcMessageResponse(epcMessage, new Date());
    } else {
        console.error('method=receiveEpcMessage XML validation failed');
        return Promise.reject(BAD_REQUEST_MESSAGE);
    }
}
