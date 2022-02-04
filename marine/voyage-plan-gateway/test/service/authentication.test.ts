import {generateHmacAuthorizationHeader} from "../../lib/service/authentication";

describe('authentication service', () => {

    test('generateHmacAuthorizationHeader - empty URL', () => {
        expect(() => {
            generateHmacAuthorizationHeader('', '1', '2');
        }).toThrow();
    });

    test('generateHmacAuthorizationHeader - empty app id', () => {
        expect(() => {
            generateHmacAuthorizationHeader('https://no.pe', '', '2');
        }).toThrow();
    });

    test('generateHmacAuthorizationHeader - empty API key', () => {
        expect(() => {
            generateHmacAuthorizationHeader('https://no.pe', '1', '');
        }).toThrow();
    });

    test('generateHmacAuthorizationHeader - HMAC header format', () => {
        const header = generateHmacAuthorizationHeader('https://no.pe', '1', '2');

        expect(/amx \w+:[a-zA-Z0-9:=/+]+:[a-zA-Z0-9-]+:\w+/.test(header)).toBe(true);
    });

});
