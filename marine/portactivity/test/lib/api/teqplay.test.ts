import {getMessagesFromTeqplay} from "../../../lib/service/teqplay";

describe('text-converter-tests', () => {
    test('empty', async () => {
        process.env.TEQPLAY_URL = 'fill_here';
        console.info(await getMessagesFromTeqplay());
    });
});