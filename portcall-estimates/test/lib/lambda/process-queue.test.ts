import * as pgPromise from "pg-promise";
import {dbTestBase, findAll} from "../db-testutil";
import {handlerFn} from "../../../lib/lambda/process-queue/lambda-process-queue";
import {SQSRecord} from "aws-lambda";
import {ApiEstimate} from "../../../lib/model/estimate";
import {randomString} from "../../../../common/test/testutils";
import {newEstimate} from "../testdata";

describe('process-queue', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('no records', async () => {
        await handlerFn({
            Records: []
        });
    });

    test('single valid record', async () => {
        const estimate = newEstimate();

        await handlerFn({
            Records: [createRecord(estimate)]
        });

        const allEstimates = await findAll(db);
        expect(allEstimates.length).toBe(1);
    });

    test('single invalid record', async () => {
        const estimate = newEstimate();
        delete (estimate as any).eventType;

        await handlerFn({
            Records: [createRecord(estimate)]
        });

        const allEstimates = await findAll(db);
        expect(allEstimates.length).toBe(0);
    });

    test('valid & invalid record', async () => {
        const validEstimate = newEstimate();
        const invalidEstimate = newEstimate();
        delete (invalidEstimate as any).eventType;

        const promises = await handlerFn({
            Records: [createRecord(validEstimate), createRecord(invalidEstimate)]
        });

        expect(promises.find(p => p.status == 'fulfilled')).toBeDefined();
        expect(promises.find(p => p.status == 'rejected')).toBeDefined();
    });

}));

function createRecord(estimate: ApiEstimate): SQSRecord {
    // none of these matter besides body
    return {
        body: JSON.stringify(estimate),
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
