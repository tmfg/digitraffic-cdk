import {NodePingApi, NodePingCheck, NodePingCheckState, NodePingCheckType} from "../../lib/api/nodeping";
import {randomString} from "digitraffic-common/test/testutils";
import {EndpointHttpMethod, EndpointProtocol} from "../../lib/app-props";

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

    test('checkNeedsUpdate - http method not explicitly configured - needs to be HEAD', () => {
        const api = makeApi(30);
        const check = makeCheck(undefined, EndpointHttpMethod.GET);

        expect(api.checkNeedsUpdate(check)).toBe(true);
    });

    test('checkNeedsUpdate - http method not explicitly configured - already HEAD', () => {
        const api = makeApi(30);
        const check = makeCheck(undefined, EndpointHttpMethod.HEAD);

        expect(api.checkNeedsUpdate(check)).toBe(false);
    });

    test('checkNeedsUpdate - http method explicitly configured - different', () => {
        const api = makeApi(30);
        const check = makeCheck(undefined, EndpointHttpMethod.GET);

        expect(api.checkNeedsUpdate(check, {
            name: 'name',
            method: EndpointHttpMethod.HEAD,
            protocol: EndpointProtocol.HTTP,
            url: check.parameters.target,
        })).toBe(true);
    });

    test('checkNeedsUpdate - http method explicitly configured - same', () => {
        const api = makeApi(30);
        const check = makeCheck(undefined, EndpointHttpMethod.HEAD);

        expect(api.checkNeedsUpdate(check, {
            name: 'name',
            method: EndpointHttpMethod.HEAD,
            protocol: EndpointProtocol.HTTP,
            url: check.parameters.target,
        })).toBe(false);
    });

    test('checkNeedsUpdate - no need to update mqtt method', () => {
        const api = makeApi(30);
        const check = { ...makeCheck(), ...{
            type: NodePingCheckType.WEBSOCKET,
        }};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (check.parameters as any).method;

        expect(api.checkNeedsUpdate(check, {
            name: 'name',
            protocol: EndpointProtocol.WebSocket,
            url: check.parameters.target,
        })).toBe(false);
    });

});

function makeApi(timeout?: number): NodePingApi {
    return new NodePingApi('token', 'subAccountId', timeout);
}

function makeCheck(timeout?: number, method = EndpointHttpMethod.HEAD): NodePingCheck {
    return {
        _id: randomString(),
        type: NodePingCheckType.HTTPADV,
        label: randomString(),
        state: NodePingCheckState.UP,
        parameters: {
            target: 'http://some.url',
            method,
            threshold: timeout ?? 30,
        },
    };
}