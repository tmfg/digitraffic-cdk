import {Statistics} from "../../../lib/lambda/kinesis-to-es/statistics";

const accountNumber = '123456789012';
const app = 'someapp';
const env = 'someenv';
const accounts: Account[] = [{
    accountNumber,
    app,
    env,
}];
process.env.KNOWN_ACCOUNTS = JSON.stringify(accounts);
process.env.ES_ENDPOINT = 'some-elasticsearch-domain-asdfasdfasdf.eu-west-1.es.amazonaws.com';

import {CloudWatchLogsDecodedData, CloudWatchLogsLogEvent} from "aws-lambda";
import {
    buildSource,
    isLambdaLifecycleEvent,
    transform,
} from '../../../lib/lambda/kinesis-to-es/lambda-kinesis-to-es';
import {getAppFromSenderAccount, getEnvFromSenderAccount} from "../../../lib/lambda/kinesis-to-es/accounts";
import {Account} from "../../../lib/app-props";

const TEST_LOGLINE = '2021-10-08T05:41:10.271Z\tec182986-d87f-5ce8-8ad8-705f04503e55\tINFO\tlogline';

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
        const account: Account = { accountNumber: accountNumber, env, app };
        expect(getAppFromSenderAccount(account.accountNumber, [account])).toBe(account.app);
    });

    test('getAppFromSenderAccount error', () => {
        const account: Account = { accountNumber: accountNumber, env, app };
        expect(() => getAppFromSenderAccount('4567890123', [account])).toThrow();
    });

    test('getEnvFromSenderAccount true', () => {
        const account: Account = { accountNumber: accountNumber, env, app };
        expect(getEnvFromSenderAccount(accountNumber, [account])).toBe(account.env);
    });

    test('getEnvFromSenderAccount error', () => {
        const account: Account = { accountNumber: accountNumber, env, app };
        expect(() => getEnvFromSenderAccount('4567890123', [account])).toThrow();
    });

    test('buildSource', () => {
        const source = buildSource(TEST_LOGLINE, undefined);
        expect(source.log_line).toBe(TEST_LOGLINE);
    });

    test('transform', () => {
        const account: Account = { accountNumber: accountNumber, env, app };
        const logEvent: CloudWatchLogsLogEvent = {
            id: 'some-id',
            timestamp: 0,
            message: 'message',
        };
        const data: CloudWatchLogsDecodedData = {
            owner: account.accountNumber,
            logGroup: '',
            logStream: '',
            subscriptionFilters: [],
            messageType: '',
            logEvents: [logEvent],
        };

        const transformed = transform(data, new Statistics());

        expect(transformed).toBe('{"index":{"_id":"some-id","_index":"someapp-someenv-lambda-1970.01","_type":"doc"}}\n' +
            '{"log_line":"message","@id":"some-id","@timestamp":"1970-01-01T00:00:00.000Z","@log_group":"","@app":"someapp-someenv-lambda","fields":{"app":"someapp-someenv-lambda"},"@transport_type":"someapp"}\n');
    });

});
