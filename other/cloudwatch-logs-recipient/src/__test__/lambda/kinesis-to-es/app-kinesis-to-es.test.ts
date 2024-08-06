import type { Account } from "../../../app-props.js";
import { buildSource } from "../../../lambda/kinesis-to-es/app-kinesis-to-es.js";

const accountNumber = "123456789012";
const app = "someapp";
const env = "someenv";
const accounts: Account[] = [
    {
        accountNumber,
        app,
        env
    }
];
// eslint-disable-next-line dot-notation
process.env["TOPIC_ARN"] = "somearn";
// eslint-disable-next-line dot-notation
process.env["KNOWN_ACCOUNTS"] = JSON.stringify(accounts);
// eslint-disable-next-line dot-notation
process.env["ES_ENDPOINT"] = "some-elasticsearch-domain-asdfasdfasdf.eu-west-1.es.amazonaws.com";

describe("app-kinesis-to-es", () => {
    test("buildSource one upstream_response_time", () => {
        const source = buildSource('{ "@fields": { "upstream_response_time": "0.008" } }', undefined);
        expect(source["@fields"].upstream_response_time).toBe(0.008);
    });

    test("buildSource two upstream_response_time", () => {
        const source = buildSource('{ "@fields": { "upstream_response_time": "0.008 : 0.132" } }', undefined);
        expect(source["@fields"].upstream_response_time).toBe(0.14);
    });

    test("buildSource two upstream_response_time second empty", () => {
        const source = buildSource('{ "@fields": { "upstream_response_time": "1.1 : " } }', undefined);
        expect(source["@fields"].upstream_response_time).toBe(1.1);
    });

    test("buildSource two upstream_response_time first empty", () => {
        const source = buildSource('{ "@fields": { "upstream_response_time": ": 1.2 " } }', undefined);
        expect(source["@fields"].upstream_response_time).toBe(1.2);
    });

    test("buildSource empty upstream_response_time", () => {
        const source = buildSource('{ "@fields": { "upstream_response_time": "" } }', undefined);
        expect(source["@fields"].upstream_response_time).toBe(-1.0);
    });

    test("buildSource undefined upstream_response_time", () => {
        const source = buildSource('{ "@fields": { } }', undefined);
        expect(source["@fields"].upstream_response_time).toBe(undefined);
    });

    test("buildSource undefined fields", () => {
        const source = buildSource("{ }", undefined);
        expect(source["@fields"]).toBe(undefined);
    });

    test("buildSource NaN upstream_response_time returns -1.0 case 1", () => {
        const source = buildSource('{ "@fields": { "upstream_response_time": "abc" } }', undefined);
        expect(source["@fields"].upstream_response_time).toBe(-1.0);
    });

    test("buildSource NaN upstream_response_time returns as -1.0 case 2", () => {
        const source = buildSource('{ "@fields": { "upstream_response_time": "abc : def" } }', undefined);
        expect(source["@fields"].upstream_response_time).toBe(-1.0);
    });

    test("buildSource NaN upstream_response_time returns as -1.0 case 3", () => {
        const source = buildSource('{ "@fields": { "upstream_response_time": "" } }', undefined);
        expect(source["@fields"].upstream_response_time).toBe(-1.0);
    });

    test("buildSource NaN upstream_response_time returns as -1.0 case 4", () => {
        const source = buildSource('{ "@fields": { "upstream_response_time": "1.0 : abc" } }', undefined);
        expect(source["@fields"].upstream_response_time).toBe(-1.0);
    });

    test("buildSource NaN upstream_response_time returns as -1.0 case 5", () => {
        const source = buildSource('{ "@fields": { "upstream_response_time": "1.0.0" } }', undefined);
        expect(source["@fields"].upstream_response_time).toBe(-1.0);
    });
});
