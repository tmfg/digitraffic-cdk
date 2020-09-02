import * as pgPromise from "pg-promise";
import {dbTestBase, findAll} from "../db-testutil";
import {handlerFn} from "../../../lib/lambda/process-queue/lambda-process-queue";
import {SQSRecord} from "aws-lambda";
import {ApiEstimate} from "../../../lib/model/estimate";
import * as sinon from 'sinon';
import {newEstimate} from "../testdata";
import {SNS} from "aws-sdk";

describe('process-queue', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    test('no records', async () => {
        await handlerFn(new SNS())({ Records: [] });
    });

    test('single valid record', async () => {
        const sns = new SNS();
        const publishStub = sandbox.stub().returns(Promise.resolve());
        sandbox.stub(sns, 'publish').returns({promise: publishStub} as any);
        const estimate = newEstimate();

        await handlerFn(sns)({
            Records: [createRecord(estimate)]
        });

        const allEstimates = await findAll(db);
        expect(allEstimates.length).toBe(1);
        expect(publishStub.calledOnce).toBe(true);
    });

    test('single invalid record', async () => {
        const sns = new SNS();
        const publishStub = sandbox.stub().returns(Promise.resolve());
        sandbox.stub(sns, 'publish').returns({promise: publishStub} as any);
        const estimate = newEstimate();
        delete (estimate as any).eventType;

        await handlerFn(sns)({
            Records: [createRecord(estimate)]
        });

        const allEstimates = await findAll(db);
        expect(allEstimates.length).toBe(0);
        expect(publishStub.calledOnce).toBe(false);
    });

    test('valid & invalid record', async () => {
        const sns = new SNS();
        const publishStub = sandbox.stub().returns(Promise.resolve());
        sandbox.stub(sns, 'publish').returns({promise: publishStub} as any);
        const validEstimate = newEstimate();
        const invalidEstimate = newEstimate();
        delete (invalidEstimate as any).eventType;

        const promises = await handlerFn(sns)({
            Records: [createRecord(validEstimate), createRecord(invalidEstimate)]
        });

        expect(promises.find(p => p.status == 'fulfilled')).toBeDefined();
        expect(promises.find(p => p.status == 'rejected')).toBeDefined();
        expect(publishStub.calledOnce).toBe(true);
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
