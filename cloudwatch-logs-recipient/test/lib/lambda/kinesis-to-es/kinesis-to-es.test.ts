import {CloudWatchLogsDecodedData, CloudWatchLogsLogEvent} from "aws-lambda";
import {
    buildSource,
    isLambdaLifecycleEvent,
    transform
} from '../../../../lib/lambda/kinesis-to-es/lambda-kinesis-to-es';
import {getAppFromSenderAccount, getEnvFromSenderAccount} from "../../../../lib/lambda/kinesis-to-es/accounts";

describe('kinesis-to-es', () => {

    test('isLambdaLifecycleEvent true', () => {
        expect(isLambdaLifecycleEvent('START RequestId')).toBe(true);
        expect(isLambdaLifecycleEvent('REPORT RequestId')).toBe(true);
        expect(isLambdaLifecycleEvent('END RequestId')).toBe(true);
    });

    test('isLambdaLifecycleEvent false', () => {
        expect(isLambdaLifecycleEvent('some other text')).toBe(false);
    });

    test('getAppFromSenderAccount true', () => {
        const account: Account = { accountNumber: '123456789012', env: 'someenv', app: 'someapp' };
        expect(getAppFromSenderAccount(account.accountNumber, [account])).toBe(account.app);
    });

    test('getAppFromSenderAccount error', () => {
        const account: Account = { accountNumber: '123456789012', env: 'someenv', app: 'someapp' };
        expect(() => getAppFromSenderAccount('4567890123', [account])).toThrow();
    });

    test('getEnvFromSenderAccount true', () => {
        const account: Account = { accountNumber: '123456789012', env: 'someenv', app: 'someapp' };
        expect(getEnvFromSenderAccount('123456789012', [account])).toBe(account.env);
    });

    test('getEnvFromSenderAccount error', () => {
        const account: Account = { accountNumber: '123456789012', env: 'someenv', app: 'someapp' };
        expect(() => getEnvFromSenderAccount('4567890123', [account])).toThrow();
    });

    test('buildSource', () => {
        const source = buildSource('message', undefined);
        expect(source.log_line).toBe('\bmessage\b');
    });

    test('transform', () => {
        const account: Account = { accountNumber: '123456789012', env: 'someenv', app: 'someapp' };
        const logEvent: CloudWatchLogsLogEvent = {
            id: 'some-id',
            timestamp: 0,
            message: 'message'
        };
        const data: CloudWatchLogsDecodedData = {
            owner: account.accountNumber,
            logGroup: '',
            logStream: '',
            subscriptionFilters: [],
            messageType: '',
            logEvents: [logEvent]
        };

        const transformed = transform(data, [account]);

        expect(transformed).toBe('{"index":{"_id":"some-id","_index":"someapp-someenv-lambda-1970.01","_type":"doc"}}\n' +
            '{"log_line":"\\bmessage\\b","@id":"some-id","@timestamp":"1970-01-01T00:00:00.000Z","@log_group":"","@app":"someapp-someenv-lambda","fields":{"app":"someapp-someenv-lambda"},"@transport_type":"someapp"}\n');
    });

});
