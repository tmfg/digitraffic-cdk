import * as util from 'util';
import * as xml2js from 'xml2js';
import {BAD_REQUEST_MESSAGE} from "digitraffic-common/api/errors";
import * as EpcMessageService from '../../service/epcmessage';
import {ClientEpcMessage} from "../../model/clientepcmessage";
import {EpcMessage} from "../../model/epcmessage";

export async function handler(event: {body: string}): Promise<string> {
    let epcMessage: ClientEpcMessage
    try {
        const parseXml = util.promisify(xml2js.parseString);
        epcMessage = (await parseXml(event.body)) as ClientEpcMessage;
    } catch (error) {
        console.error('method=receiveEpcMessage XML parsing failed', error);
        return Promise.reject(BAD_REQUEST_MESSAGE);
    }

    console.info(`method=receiveEpcMessage received message: ${JSON.stringify(epcMessage)}`);

    if (!EpcMessageService.isValidEpcMessage(epcMessage)) {
        console.error('method=receiveEpcMessage XML validation failed');
        return Promise.reject(BAD_REQUEST_MESSAGE);
    }

    // TODO implement proxying to final destination
    return EpcMessageService.createEpcMessageResponse(epcMessage as EpcMessage, new Date());
}
