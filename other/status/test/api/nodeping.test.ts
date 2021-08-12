import {NodePingApi, NodePingCheck, NodePingCheckState} from "../../lib/api/nodeping";
import {getRandomInteger, randomString} from "digitraffic-common/test/testutils";

describe('NodePing API', () => {

    test('checkNeedsUpdate - no need if timeout is not configured', () => {
        const api = makeApi();
        const check = makeCheck();

        expect(api.checkNeedsUpdate(check)).toBe(false);
    });

    test('checkNeedsUpdate - timeout configured - equal timeout value', () => {
        const api = makeApi(30);
        const check = makeCheck(30);

        expect(api.checkNeedsUpdate(check)).toBe(false);
    });

    test('checkNeedsUpdate - timeout configured - different timeout value', () => {
        const api = makeApi(30);
        const check = makeCheck(5);

        expect(api.checkNeedsUpdate(check)).toBe(true);
    });

});

function makeApi(timeout?: number): NodePingApi {
    return new NodePingApi('token', 'subAccountId', timeout);
}

function makeCheck(timeout?: number): NodePingCheck {
    return {
        _id: randomString(),
        type: 'HTTPADV',
        label: randomString(),
        state: NodePingCheckState.UP,
        parameters: {
            threshold: timeout ?? getRandomInteger(1, 50)
        }
    }
}