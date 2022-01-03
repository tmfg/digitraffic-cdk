import {
    NODEPING_DIGITRAFFIC_USER,
    NodePingApi,
    NodePingCheck,
    NodePingCheckState,
    NodePingCheckType,
} from "../../lib/api/nodeping";
import {randomString} from "digitraffic-common/test/testutils";
import {EndpointHttpMethod, EndpointProtocol} from "../../lib/app-props";

describe('NodePing API', () => {

    test('checkNeedsUpdate - timeout configured - equal timeout value', () => {
        const api = makeApi({timeout: 30});
        const check = makeCheck({timeout: 30});

        expect(api.checkNeedsUpdate(check)).toBe(false);
    });

    test('checkNeedsUpdate - timeout configured - different timeout value', () => {
        const api = makeApi({timeout: 30});
        const check = makeCheck({timeout: 5});

        expect(api.checkNeedsUpdate(check)).toBe(true);
    });

    test('checkNeedsUpdate - interval configured - equal interval value', () => {
        const api = makeApi({interval: 3});
        const check = makeCheck({interval: 3});

        expect(api.checkNeedsUpdate(check)).toBe(false);
    });

    test('checkNeedsUpdate - interval configured - different interval value', () => {
        const api = makeApi({interval: 1});
        const check = makeCheck({interval: 5});

        expect(api.checkNeedsUpdate(check)).toBe(true);
    });

    test('checkNeedsUpdate - correct digitraffic-user', () => {
        const api = makeApi();
        const check = makeCheck({headers: { 'digitraffic-user': NODEPING_DIGITRAFFIC_USER }});

        expect(api.checkNeedsUpdate(check)).toBe(false);
    });

    test('checkNeedsUpdate - wrong digitraffic-user', () => {
        const api = makeApi();
        const check = makeCheck({headers: {'digitraffic-user': 'asdf'}});

        expect(api.checkNeedsUpdate(check)).toBe(true);
    });

    test('checkNeedsUpdate - digitraffic-user not configured', () => {
        const api = makeApi();
        const check = makeCheck({headers: {'not-digitraffic-user': 'asdf'}});

        expect(api.checkNeedsUpdate(check)).toBe(true);
    });

    test('checkNeedsUpdate - http method not explicitly configured - needs to be HEAD', () => {
        const api = makeApi();
        const check = makeCheck({method: EndpointHttpMethod.GET});

        expect(api.checkNeedsUpdate(check)).toBe(true);
    });

    test('checkNeedsUpdate - http method not explicitly configured - already HEAD', () => {
        const api = makeApi();
        const check = makeCheck({method: EndpointHttpMethod.HEAD});

        expect(api.checkNeedsUpdate(check)).toBe(false);
    });

    test('checkNeedsUpdate - http method explicitly configured - different', () => {
        const api = makeApi();
        const check = makeCheck({method: EndpointHttpMethod.GET});

        expect(api.checkNeedsUpdate(check, {
            name: 'name',
            method: EndpointHttpMethod.HEAD,
            protocol: EndpointProtocol.HTTP,
            url: check.parameters.target,
        })).toBe(true);
    });

    test('checkNeedsUpdate - http method explicitly configured - same', () => {
        const api = makeApi();
        const check = makeCheck({method: EndpointHttpMethod.HEAD});

        expect(api.checkNeedsUpdate(check, {
            name: 'name',
            method: EndpointHttpMethod.HEAD,
            protocol: EndpointProtocol.HTTP,
            url: check.parameters.target,
        })).toBe(false);
    });

    test('checkNeedsUpdate - no need to update mqtt method', () => {
        const api = makeApi();
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

function makeApi(options?: {timeout?: number, interval?: number }): NodePingApi {
    return new NodePingApi('token', 'subAccountId', options?.timeout, options?.interval);
}

function makeCheck(options?: {timeout?: number, method?: EndpointHttpMethod, interval?: number, headers?: Record<string, string>}): NodePingCheck {
    return {
        _id: randomString(),
        type: NodePingCheckType.HTTPADV,
        label: randomString(),
        state: NodePingCheckState.UP,
        interval: options?.interval ?? 5,
        parameters: {
            target: 'http://some.url',
            method: options?.method ?? EndpointHttpMethod.HEAD,
            threshold: options?.timeout ?? 30,
            sendheaders: options?.headers ?? {'digitraffic-user': NODEPING_DIGITRAFFIC_USER},
        },
    };
}