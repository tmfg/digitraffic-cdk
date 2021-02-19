import {getMessages} from "../../../lib/service/teqplay";

describe('text-converter-tests', () => {
    test('empty', async () => {
        await getMessages();
    });
});