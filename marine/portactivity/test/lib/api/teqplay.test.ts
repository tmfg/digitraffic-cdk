import {getMessages} from "../../../lib/api/teqplay";

describe('teqplay-api-tests', () => {
    test('getMessages', async () => {
        console.info(await getMessages('fill_here', 'fintraffic'));
    });
});