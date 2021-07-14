const accountNumber = '123456789012';
const app = 'someapp';
const env = 'someenv';
const accounts: Account[] = [{
    accountNumber,
    app,
    env
}];
process.env.KNOWN_ACCOUNTS = JSON.stringify(accounts);
process.env.ES_ENDPOINT = 'some-elasticsearch-domain-asdfasdfasdf.eu-west-1.es.amazonaws.com';

import {
    buildSource
} from '../../../lib/lambda/kinesis-to-es/app-kinesis-to-es';

describe('app-kinesis-to-es', () => {

    test('buildSource one upstream_response_time', () => {
        const source = buildSource('{ "@fields": { "upstream_response_time": "0.008" } }', undefined);
        expect(source["@fields"].upstream_response_time).toBe('0.008');
    });

    test('buildSource two upstream_response_time', () => {
        const source = buildSource('{ "@fields": { "upstream_response_time": "0.008 : 0.132" } }', undefined);
        expect(source["@fields"].upstream_response_time).toBe('0.140');
    });

    test('buildSource empty upstream_response_time', () => {
        const source = buildSource('{ "@fields": { "upstream_response_time": "" } }', undefined);
        expect(source["@fields"].upstream_response_time).toBe("");
    });

    test('buildSource undefined upstream_response_time', () => {
        const source = buildSource('{ "@fields": { } }', undefined);
        expect(source["@fields"].upstream_response_time).toBe(undefined);
    });

    test('buildSource NaN upstream_response_time returns as it is', () => {
        const source = buildSource('{ "@fields": { "upstream_response_time": "abc" } }', undefined);
        expect(source["@fields"].upstream_response_time).toBe("abc");
    });

    test('buildSource undefined fields', () => {
        const source = buildSource('{ }', undefined);
        expect(source["@fields"].upstream_response_time).toBe(undefined);
    });
});
