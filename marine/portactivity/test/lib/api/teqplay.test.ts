import {getMessagesFromTeqplay} from "../../../lib/service/teqplay";

describe('text-converter-tests', () => {
    test('empty', async () => {
        console.info(await getMessagesFromTeqplay());
    });
});