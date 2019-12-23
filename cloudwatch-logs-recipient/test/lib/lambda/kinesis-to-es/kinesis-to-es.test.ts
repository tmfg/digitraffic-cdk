import * as sinon from 'sinon';
import * as AWS from 'aws-sdk';
import {CloudWatchLogsDecodedData, CloudWatchLogsLogEvent} from "aws-lambda";
const zlib = require("zlib");
import {
    Account,
    buildSource,
    isLambdaLifecycleEvent,
    getAppFromSenderAccount,
    getEnvFromSenderAccount,
    transform
} from '../../../../lib/lambda/kinesis-to-es/lambda-kinesis-to-es';

describe('kinesis-to-es', () => {
/*
    beforeAll(() => {
        process.env.AWS_REGION = 'someregion';
        process.env.ES_ENDPOINT = 'https://some-endpoint.com';
        process.env.KNOWN_ACCOUNTS = JSON.stringify([{
            accountNumber: '123456789012',
            env: 'local',
            app: 'road'
        }]);
    });
    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());
 */

    test('isLambdaLifecycleEvent true', () => {
        expect(isLambdaLifecycleEvent('START RequestId')).toBe(true);
        expect(isLambdaLifecycleEvent('REPORT RequestId')).toBe(true);
        expect(isLambdaLifecycleEvent('END RequestId')).toBe(true);
    });

    test('isLambdaLifecycleEvent false', () => {
        expect(isLambdaLifecycleEvent('some other text')).toBe(false);
    });

    test('getAppFromSenderAccount true', () => {
        const account: Account = { accountNumber: '123456789012', env: 'someenv', app: 'some-app' };
        expect(getAppFromSenderAccount(account.accountNumber, [account])).toBe(account.app);
    });

    test('getAppFromSenderAccount false', () => {
        const account: Account = { accountNumber: '123456789012', env: 'someenv', app: 'some-app' };
        expect(getAppFromSenderAccount('4567890123', [account])).not.toBe(account.app);
    });

    test('getEnvFromSenderAccount true', () => {
        const account: Account = { accountNumber: '123456789012', env: 'someenv', app: 'some-app' };
        expect(getEnvFromSenderAccount('123456789012', [account])).toBe(account.env);
    });

    test('getEnvFromSenderAccount false', () => {
        const account: Account = { accountNumber: '123456789012', env: 'someenv', app: 'some-app' };
        expect(getEnvFromSenderAccount('4567890123', [account])).not.toBe(account.env);
    });

    test('buildSource', () => {
        const source = buildSource('message', undefined);
        expect(source.log_line).toBe('\bmessage\b');
    });

    test('transform', () => {
        const logEvent: CloudWatchLogsLogEvent = {
            id: 'some-id',
            timestamp: 0,
            message: 'message'
        };
        const data: CloudWatchLogsDecodedData = {
            owner: '123456789012',
            logGroup: '',
            logStream: '',
            subscriptionFilters: [],
            messageType: '',
            logEvents: [logEvent]
        };

        const transformed = transform(data, []);

        expect(transformed).toBe('{"index":{"_id":"some-id","_index":"aws-undefined-1970.01","_type":"doc"}}\n' +
            '{"log_line":"\\bmessage\\b","id":"some-id","@timestamp":"1970-01-01T00:00:00.000Z","message":"message","log_group":"","fields":{}}\n');
    });

});
/*

const handleRequestSpy = sinon.spy();
        // @ts-ignore
        sandbox.stub(AWS, 'NodeHttpClient').returns({
            handleRequest: handleRequestSpy
        });
        const handler = require('../../../../lib/lambda/kinesis-to-es/lambda-kinesis-to-es').handler;

        const data: CloudWatchLogsDecodedData = {
          owner: '123456789012',
          logGroup: '',
          logStream: '',
          subscriptionFilters: [],
          messageType: '',
          logEvents: []
        };
        zlib.gzip(JSON.stringify(data), (err: Error | null, result: Buffer) => {
            const context = {fail: sinon.stub(), succeed: sinon.stub()};
            handler({
                Records: [{kinesis: { data: result }}]
            }, context, () => {});

            //expect(handleRequestSpy.calledOnce).toBe(true);
            done();
        });

 */