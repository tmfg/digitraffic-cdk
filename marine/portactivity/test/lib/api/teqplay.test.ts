import {getMessages} from "../../../lib/api/teqplay";

describe('text-converter-tests', () => {
    test('empty', async () => {
        console.info(await getMessages());
    });
});