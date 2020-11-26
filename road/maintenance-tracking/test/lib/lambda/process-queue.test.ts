import * as pgPromise from "pg-promise";
import {dbTestBase, findAll} from "../db-testutil";
import {handlerFn} from "../../../lib/lambda/process-queue/lambda-process-queue";
import {SQSRecord} from "aws-lambda";
import {getRandompId, getTrackingJson} from "../testdata";

describe('process-queue', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('no records', async () => {
        await handlerFn()({ Records: [] });
    });

    test('single valid record', async () => {

        const json = getTrackingJson(getRandompId(),getRandompId());

        await handlerFn()({
            Records: [createRecord(json)]
        });

        const allTrackings = await findAll(db);
        expect(allTrackings.length).toBe(1);
    });


    test('two valid records', async () => {

        const json1 = getTrackingJson(getRandompId(), getRandompId());
        const json2 = getTrackingJson(getRandompId(), getRandompId());

        await handlerFn()({
            Records: [createRecord(json1), createRecord(json2)]
        });

        const allTrackings = await findAll(db);
        expect(allTrackings.length).toBe(2);
    });

    test('invalid record', async () => {

        const json1 = `invalid json ` + getTrackingJson(getRandompId(), getRandompId());

        await handlerFn()({
            Records: [createRecord(json1)]
        });

        const allTrackings = await findAll(db);
        expect(allTrackings.length).toBe(0);
    });

    test('invalid and valid record', async () => {

        const json1 = `invalid json ` + getTrackingJson(getRandompId(), getRandompId());

        const json2 = getTrackingJson(getRandompId(), getRandompId());

        await handlerFn()({
            Records: [createRecord(json1), createRecord(json2)]
        });

        const allTrackings = await findAll(db);
        expect(allTrackings.length).toBe(1);
    });

}));

function createRecord(trackingJson: string): SQSRecord {
    // none of these matter besides body
    return {
        body: trackingJson,
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
