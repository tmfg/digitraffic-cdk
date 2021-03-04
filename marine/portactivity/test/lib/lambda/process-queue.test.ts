import * as pgPromise from "pg-promise";
import {dbTestBase, findAll} from "../db-testutil";
import {handlerFn} from "../../../lib/lambda/process-queue/lambda-process-queue";
import {SQSRecord} from "aws-lambda";
import {ApiTimestamp} from "../../../lib/model/timestamp";
import {newTimestamp} from "../testdata";

// empty sec usage function for tests
const NOOP_WITH_SECRET = (secretId: string, fn: (secret: any) => Promise<void>) => fn({});

describe('process-queue', dbTestBase((db: pgPromise.IDatabase<any, any>) => {
    test('no records', async () => {
        await handlerFn(NOOP_WITH_SECRET);
    });

    test('single valid record', async () => {
        const timestamp = newTimestamp();

        await handlerFn(NOOP_WITH_SECRET)({
            Records: [createRecord(timestamp)]
        });

        const allTimestamps = await findAll(db);
        expect(allTimestamps.length).toBe(1);
    });

    test('single invalid record', async () => {
        const timestamp = newTimestamp();
        delete (timestamp as any).eventType;

        await handlerFn(NOOP_WITH_SECRET)({
            Records: [createRecord(timestamp)]
        });

        const allTimestamps = await findAll(db);
        expect(allTimestamps.length).toBe(0);
    });

    test('valid & invalid record', async () => {
        const validTimestamp = newTimestamp();
        const invalidTimestamp = newTimestamp();
        delete (invalidTimestamp as any).eventType;

        const promises = await handlerFn(NOOP_WITH_SECRET)({
            Records: [createRecord(validTimestamp), createRecord(invalidTimestamp)]
        });

        expect(promises.find(p => p.status == 'fulfilled')).toBeDefined();
        expect(promises.find(p => p.status == 'rejected')).toBeDefined();
    });

}));

function createRecord(timestamp: ApiTimestamp): SQSRecord {
    // none of these matter besides body
    return {
        body: JSON.stringify(timestamp),
        messageId: '',
        receiptHandle: '',
        messageAttributes: {},
        md5OfBody: '',
        attributes: {
            ApproximateReceiveCount: '',
            SentTimestamp: '',
            SenderId: '',
            ApproximateFirstReceiveTimestamp: '',
        },
        eventSource: '',
        eventSourceARN: '',
        awsRegion: ''
    };
}
