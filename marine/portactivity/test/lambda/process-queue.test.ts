import {dbTestBase, findAll} from "../db-testutil";
import {handlerFn} from "../../lib/lambda/process-queue/process-queue";
import {SQSRecord} from "aws-lambda";
import {ApiTimestamp} from "../../lib/model/timestamp";
import {newTimestamp} from "../testdata";
import {DTDatabase} from "digitraffic-common/postgres/database";
import * as R from 'ramda';
import {createEmptySecretFunction} from "digitraffic-common/test/secret";

// empty sec usage function for tests
const NOOP_WITH_SECRET = createEmptySecretFunction<PromiseSettledResult<any>[]>();

describe('process-queue', dbTestBase((db: DTDatabase) => {

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

    test('missing portcall id does not throw error', async () => {
        const timestamp = R.omit(['portcallId'], newTimestamp());

        await handlerFn(NOOP_WITH_SECRET)({
            Records: [createRecord(timestamp)]
        });

        const allTimestamps = await findAll(db);
        expect(allTimestamps.length).toBe(0);
    });

    test('single invalid record', async () => {
        const timestamp = R.omit(['eventType'], newTimestamp()) as ApiTimestamp;

        await handlerFn(NOOP_WITH_SECRET)({
            Records: [createRecord(timestamp)]
        });

        const allTimestamps = await findAll(db);
        expect(allTimestamps.length).toBe(0);
    });

    test('both valid & invalid records return fulfilled promises', async () => {
        const validTimestamp = newTimestamp();
        const invalidTimestamp = R.omit(['eventType'], newTimestamp()) as ApiTimestamp;

        const promises = await handlerFn(NOOP_WITH_SECRET)({
            Records: [createRecord(validTimestamp), createRecord(invalidTimestamp)]
        });

        expect(promises.filter((p: PromiseSettledResult<unknown>) => p.status == 'fulfilled')).toHaveLength(2);
        const allTimestamps = await findAll(db);
        expect(allTimestamps.length).toBe(1);
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
