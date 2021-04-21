import {SQS_BUCKET_NAME, SQS_QUEUE_URL} from "../../../lib/lambda/constants";
process.env[SQS_BUCKET_NAME] = 'sqs-bucket-name';
process.env[SQS_QUEUE_URL] = 'https://aws-queue-123';
import * as pgPromise from "pg-promise";
import {dbTestBase, findAllObservations, findAllTrackings, truncate} from "../db-testutil";
import {handlerFn} from "../../../lib/lambda/process-queue/lambda-process-queue";
import {SQSRecord} from "aws-lambda";
import {getRandompId, getTrackingJson} from "../testdata";
import * as sinon from 'sinon';
import {createSQSExtClient} from "../../../lib/sqs-ext";
import moment from 'moment-timezone';


describe('process-queue', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    const sandbox = sinon.createSandbox();
    beforeEach(() => truncate(db))
    afterEach(() => sandbox.restore());

    test('no records', async () => {
        const sns : any = createSQSExtClient("bucket-name");
        const transformLambdaRecordsStub = sandbox.stub(sns, 'transformLambdaRecords').returns([]);
        await handlerFn(sns)({ Records: [] });
        expect(transformLambdaRecordsStub.calledWith([])).toBe(true);
    });

    test('single valid record', async () => {
        const json = getTrackingJson(getRandompId(),getRandompId());
        const recordFromS3 : SQSRecord = createRecord(json);
        const recordNoJson : SQSRecord = cloneRecordWithoutJson(recordFromS3)

        const sqsClient : any = createSQSExtClient("bucket-name");
        const transformLambdaRecordsStub = sandbox.stub(sqsClient, 'transformLambdaRecords').returns([recordFromS3]);
        // const deleteStub = sandbox.stub(sqsClient, 'deleteMessage').returns({promise: () => Promise.resolve()});
        await handlerFn(sqsClient)({
            Records: [recordNoJson]
        });

        const allTrackings = await findAllTrackings(db);
        expect(allTrackings.length).toBe(1);

        const allObservations = await findAllObservations(db);
        expect(allObservations.length).toBe(3);

        let prevObservationTime = moment("2019-01-30T12:00:04+02:00").valueOf();
        for(const obs of allObservations) {
            console.info(JSON.stringify(obs));
            const observationTime = moment(obs.observationTime).valueOf();
            expect(observationTime).toBeGreaterThan(prevObservationTime);
            prevObservationTime = observationTime;
            console.info("epoc: ", observationTime);
        }

        expect(transformLambdaRecordsStub.calledWith([recordNoJson])).toBe(true);
        // expect(deleteStub.calledOnceWith({ "QueueUrl" : process.env[SQS_QUEUE_URL], "ReceiptHandle" : recordFromS3.receiptHandle } )).toBe(true);
    });


    test('two valid records', async () => {

        // Create two records
        const json1 = getTrackingJson(getRandompId(), getRandompId());
        const record1FromS3 : SQSRecord = createRecord(json1);
        const record1NoJson : SQSRecord = cloneRecordWithoutJson(record1FromS3);

        const json2 = getTrackingJson(getRandompId(), getRandompId());
        const record2FromS3 : SQSRecord = createRecord(json2);
        const record2NoJson : SQSRecord = cloneRecordWithoutJson(record2FromS3);

        const sqsClient : any = createSQSExtClient("bucket-name");
        const transformLambdaRecordsStub = sandbox.stub(sqsClient, 'transformLambdaRecords').returns([record1FromS3, record2FromS3]);
        // const deleteStub = sandbox.stub(sqsClient, 'deleteMessage').returns({promise: () => Promise.resolve()});

        await handlerFn(sqsClient)({
            Records: [record1NoJson, record2NoJson]
        });

        const allTrackings = await findAllTrackings(db);
        expect(allTrackings.length).toBe(2);


        const allObservations = await findAllObservations(db);
        expect(allObservations.length).toBe(6);

        let prevObservationTime = moment("2019-01-30T12:00:04+02:00").valueOf();
        for(const obs of allObservations) {
            console.info(JSON.stringify(obs));
            const observationTime = moment(obs.observationTime).valueOf();
            expect(observationTime).toBeGreaterThanOrEqual(prevObservationTime);
            prevObservationTime = observationTime;
            console.info("epoc: ", observationTime);
        }

        expect(transformLambdaRecordsStub.calledWith([record1NoJson, record2NoJson])).toBe(true);
        // expect(deleteStub.calledWith({ "QueueUrl" : process.env[SQS_QUEUE_URL], "ReceiptHandle" : record1NoJson.receiptHandle})).toBe(true);
        // expect(deleteStub.calledWith({ "QueueUrl" : process.env[SQS_QUEUE_URL], "ReceiptHandle" : record2NoJson.receiptHandle})).toBe(true);
        // expect(deleteStub.callCount).toEqual(2);
    });

    test('invalid record', async () => {

        const json1 = `invalid json ` + getTrackingJson(getRandompId(), getRandompId());
        const record1FromS3 : SQSRecord = createRecord(json1);
        const record1NoJson : SQSRecord = cloneRecordWithoutJson(record1FromS3);

        const sqsClient : any = createSQSExtClient("bucket-name");
        const transformLambdaRecordsStub = sandbox.stub(sqsClient, 'transformLambdaRecords').returns([record1FromS3]);
        const deleteStub = sandbox.stub(sqsClient, 'deleteMessage').returns({promise: () => Promise.resolve()});

        await handlerFn(sqsClient)({
            Records: [record1NoJson]
        });

        const allTrackings = await findAllTrackings(db);
        expect(allTrackings.length).toBe(0);
        expect(transformLambdaRecordsStub.calledWith([record1NoJson])).toBe(true);
        expect(deleteStub.notCalled).toBe(true);
    });

    test('invalid and valid record', async () => {

        // Create two records
        const invalidJson = `invalid json ` + getTrackingJson(getRandompId(), getRandompId());
        const invalidRecordFromS3 : SQSRecord = createRecord(invalidJson);
        const invalidRecordNoJson : SQSRecord = cloneRecordWithoutJson(invalidRecordFromS3);

        const validJson = getTrackingJson(getRandompId(), getRandompId());
        const validRecordFromS3 : SQSRecord = createRecord(validJson);
        const validRecordNoJson : SQSRecord = cloneRecordWithoutJson(validRecordFromS3);

        const sqsClient : any = createSQSExtClient("bucket-name");
        const transformLambdaRecordsStub = sandbox.stub(sqsClient, 'transformLambdaRecords').returns([invalidRecordFromS3, validRecordFromS3]);
        // const deleteStub = sandbox.stub(sqsClient, 'deleteMessage').returns({promise: () => Promise.resolve()});

        await handlerFn(sqsClient)({
            Records: [invalidRecordNoJson, validRecordNoJson]
        });

        const allTrackings = await findAllTrackings(db);
        expect(allTrackings.length).toBe(1);
        expect(transformLambdaRecordsStub.calledWith([invalidRecordNoJson, validRecordNoJson])).toBe(true);
        // expect(deleteStub.calledWith({ "QueueUrl" : process.env[SQS_QUEUE_URL], "ReceiptHandle" : validRecordNoJson.receiptHandle})).toBe(true);
        // expect(deleteStub.callCount).toEqual(1);
    });

    test('json', async () => {
        console.info(RECEIPT_HANDLE_SEPARATOR);
        const json = getTrackingJson(getRandompId(),getRandompId());
        console.info("JSON: ", json)
    });
}));

function createRecord(trackingJson = ''): SQSRecord {
    // none of these matter besides body
    return {
        body: trackingJson,
        messageId: '',
        receiptHandle: getRandompId(),
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

function cloneRecordWithoutJson(recordToClone: SQSRecord) {
    const clone = Object.assign({}, recordToClone);
    clone.body = '';
    return clone;
}



