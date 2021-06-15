import {RECEIPT_HANDLE_SEPARATOR, SQS_BUCKET_NAME, SQS_QUEUE_URL} from "../../lib/lambda/constants";
const QUEUE = 'MaintenanceTrackingQueue.fifo';
process.env[SQS_BUCKET_NAME] = 'sqs-bucket-name';
process.env[SQS_QUEUE_URL] = `https://sqs.eu-west-1.amazonaws.com/123456789/${QUEUE}`;
import * as pgPromise from "pg-promise";
import {dbTestBase, findAllObservations} from "../db-testutil";
import * as LambdaProcessQueue from "../../lib/lambda/process-queue/lambda-process-queue";
import {SQSRecord} from "aws-lambda";
import {getRandompId, getTrackingJsonWith3Observations} from "../testdata";
import * as sinon from 'sinon';
import {createSQSExtClient} from "../../lib/sqs-ext";
import moment from 'moment-timezone';
import {DbObservationData, Status} from "../../lib/db/maintenance-tracking";

describe('process-queue', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    test('no records', async () => {
        const sns : any = createSQSExtClient("bucket-name");
        const transformLambdaRecordsStub = sandbox.stub(sns, 'transformLambdaRecords').returns([]);
        await LambdaProcessQueue.handlerFn(sns)({ Records: [] });
        expect(transformLambdaRecordsStub.calledWith([])).toBe(true);
    });

    test('single valid record', async () => {
        console.info(RECEIPT_HANDLE_SEPARATOR);
        const json = getTrackingJsonWith3Observations(getRandompId(),getRandompId());
        const recordFromS3 : SQSRecord = createRecord(json);
        const recordNoJson : SQSRecord = cloneRecordWithoutJson(recordFromS3)

        const sqsClient : any = createSQSExtClient("bucket-name");
        const transformLambdaRecordsStub = sandbox.stub(sqsClient, 'transformLambdaRecords').returns([recordFromS3]);
        await LambdaProcessQueue.handlerFn(sqsClient)({
            Records: [recordNoJson]
        });

        const allObservations = await findAllObservations(db);
        expect(allObservations.length).toBe(3);

        let prevObservationTime = moment("2019-01-30T12:00:00+02:00").valueOf();
        for(const obs of allObservations) {
            console.info(JSON.stringify(obs));
            const observationTime = moment(obs.observationTime).valueOf();
            expect(observationTime).toBeGreaterThan(prevObservationTime);
            prevObservationTime = observationTime;
            console.info("epoc: ", observationTime);
        }

        expect(transformLambdaRecordsStub.calledWith([recordNoJson])).toBe(true);
    });


    test('two valid records', async () => {

        // Create two records
        const json1 = getTrackingJsonWith3Observations(getRandompId(), getRandompId());
        const record1FromS3 : SQSRecord = createRecord(json1);
        const record1NoJson : SQSRecord = cloneRecordWithoutJson(record1FromS3);

        const json2 = getTrackingJsonWith3Observations(getRandompId(), getRandompId());
        const record2FromS3 : SQSRecord = createRecord(json2);
        const record2NoJson : SQSRecord = cloneRecordWithoutJson(record2FromS3);

        const sqsClient : any = createSQSExtClient("bucket-name");
        const transformLambdaRecordsStub = sandbox.stub(sqsClient, 'transformLambdaRecords').returns([record1FromS3, record2FromS3]);

        await LambdaProcessQueue.handlerFn(sqsClient)({
            Records: [record1NoJson, record2NoJson]
        });

        const allObservations = await findAllObservations(db);
        expect(allObservations.length).toBe(6);

        let prevObservationTime = moment("2019-01-30T12:00:00+02:00").valueOf();
        for(const obs of allObservations) {
            const observationTime = moment(obs.observationTime).valueOf();
            expect(observationTime).toBeGreaterThanOrEqual(prevObservationTime);
            prevObservationTime = observationTime;
        }

        expect(transformLambdaRecordsStub.calledWith([record1NoJson, record2NoJson])).toBe(true);
    });

    test('invalid record', async () => {

        const json1 = `invalid json ` + getTrackingJsonWith3Observations(getRandompId(), getRandompId());
        const record1FromS3 : SQSRecord = createRecord(json1);
        const record1NoJson : SQSRecord = cloneRecordWithoutJson(record1FromS3);

        const sqsClient : any = createSQSExtClient("bucket-name");
        const transformLambdaRecordsStub = sandbox.stub(sqsClient, 'transformLambdaRecords').returns([record1FromS3]);

        await LambdaProcessQueue.handlerFn(sqsClient)({
            Records: [record1NoJson]
        });

        const allObservations = await findAllObservations(db);
        expect(allObservations.length).toBe(0);

        expect(transformLambdaRecordsStub.calledWith([record1NoJson])).toBe(true);
    });

    test('invalid and valid record', async () => {

        // Create two records
        const invalidJson = `invalid json ` + getTrackingJsonWith3Observations(getRandompId(), getRandompId());
        const invalidRecordFromS3 : SQSRecord = createRecord(invalidJson);
        const invalidRecordNoJson : SQSRecord = cloneRecordWithoutJson(invalidRecordFromS3);

        const validJson = getTrackingJsonWith3Observations(getRandompId(), getRandompId());
        const validRecordFromS3 : SQSRecord = createRecord(validJson);
        const validRecordNoJson : SQSRecord = cloneRecordWithoutJson(validRecordFromS3);

        const sqsClient : any = createSQSExtClient("bucket-name");
        const transformLambdaRecordsStub = sandbox.stub(sqsClient, 'transformLambdaRecords').returns([invalidRecordFromS3, validRecordFromS3]);

        await LambdaProcessQueue.handlerFn(sqsClient)({
            Records: [invalidRecordNoJson, validRecordNoJson]
        });

        const allObservations = await findAllObservations(db);
        expect(allObservations.length).toBe(3);

        let prevObservationTime = moment("2019-01-30T12:00:00+02:00").valueOf();
        for(const obs of allObservations) {
            const observationTime = moment(obs.observationTime).valueOf();
            expect(observationTime).toBeGreaterThan(prevObservationTime);
            prevObservationTime = observationTime;
        }

        expect(transformLambdaRecordsStub.calledWith([invalidRecordNoJson, validRecordNoJson])).toBe(true);
    });

    test('invalid record missing sending system', async () => {

        const validJson = getTrackingJsonWith3Observations(getRandompId(), getRandompId());
        const trackingJson = JSON.parse(validJson);
        trackingJson.otsikko.lahettaja.jarjestelma = null;
        const invalidJson = JSON.stringify(trackingJson);
        const record : SQSRecord = createRecord(invalidJson);

        const sqsClient : any = createSQSExtClient("bucket-name");
        const transformLambdaRecordsStub = sandbox.stub(sqsClient, 'transformLambdaRecords').returns([record]);

        await LambdaProcessQueue.handlerFn(sqsClient)({
            Records: [record]
        });

        const allObservations = await findAllObservations(db);
        expect(allObservations.length).toBe(3);

        for (const entry of allObservations) {
            expect(entry.sendingSystem).toEqual('UNKNOWN');
        }

        expect(transformLambdaRecordsStub.calledWith([record])).toBe(true);
    });


    test('remove json from DbObservationData', async () => {
        const json = '{ "a" : "b" }';
        const data : DbObservationData[] = createDbObservationData();
        expect(data[0].json).toEqual(json);
        expect(data[1].json).toEqual(json);
        const clones = LambdaProcessQueue.cloneObservationsWithoutJson(data);
        const removed = '{...REMOVED...}';
        expect(clones[0].json).toEqual(removed);
        expect(clones[1].json).toEqual(removed);
    });
}));

function createRecord(trackingJson = ''): SQSRecord {
    return {
        body: trackingJson,
        messageId: '',
        receiptHandle: `s3://${process.env[SQS_BUCKET_NAME]}/${QUEUE}/${getRandompId()}${RECEIPT_HANDLE_SEPARATOR}${getRandompId()}`,
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

function createDbObservationData() : DbObservationData[] {
    return [
        {
            id: BigInt(1),
            observationTime: new Date(),
            sendingTime: new Date(),
            json: '{ "a" : "b" }',
            harjaWorkmachineId: 1,
            harjaContractId: 1,
            sendingSystem: 'System1',
            status: Status.UNHANDLED,
            hash: 'abcd',
            s3Uri: 'URL'
        },{
            id: BigInt(1),
            observationTime: new Date(),
            sendingTime: new Date(),
            json: '{ "a" : "b" }',
            harjaWorkmachineId: 1,
            harjaContractId: 1,
            sendingSystem: 'System1',
            status: Status.UNHANDLED,
            hash: 'abcd',
            s3Uri: 'URL'
        }
    ]
}