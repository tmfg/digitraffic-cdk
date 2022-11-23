import {MaintenanceTrackingEnvKeys} from "../../lib/keys";
const QUEUE = 'MaintenanceTrackingQueue';
process.env[MaintenanceTrackingEnvKeys.SQS_BUCKET_NAME] = 'sqs-bucket-name';
process.env[MaintenanceTrackingEnvKeys.SQS_QUEUE_URL] = `https://sqs.eu-west-1.amazonaws.com/123456789/${QUEUE}`;
process.env.AWS_REGION = 'aws-region';

import {SQSRecord} from "aws-lambda";
import {SecretHolder} from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import {DTDatabase} from "@digitraffic/common/dist/database/database";
import moment from 'moment-timezone';
import * as sinon from 'sinon';
import {SqsConsumer} from 'sns-sqs-big-payload';
import * as LambdaProcessQueue from "../../lib/lambda/process-queue/process-queue";
import * as SqsBigPayload from "../../lib/service/sqs-big-payload";
import {dbTestBase, findAllObservations} from "../db-testutil";
import {getRandompId, getTrackingJsonWith3Observations, getTrackingJsonWith3ObservationsAndMissingSendingSystem} from "../testdata";



function createSqsConsumerForTest() : SqsConsumer {
    return SqsBigPayload.createSqsConsumer(`${process.env[MaintenanceTrackingEnvKeys.SQS_QUEUE_URL]}`, `${process.env.AWS_REGION}`, 'processMaintenanceTrackingQueueTest');
}

describe('process-queue', dbTestBase((db: DTDatabase) => {


    const sandbox = sinon.createSandbox();
    sinon.stub(SecretHolder.prototype, 'setDatabaseCredentials').returns(Promise.resolve());

    afterEach(() => sandbox.restore());

    const sqsClient : SqsConsumer = createSqsConsumerForTest();

    test('clone record', () => {
        const clone = LambdaProcessQueue.cloneRecordWithCamelAndPascal({
            "messageId": "aaaa",
            "Body": "test",
        });
        expect(clone.messageId).toEqual("aaaa");
        expect(clone.MessageId).toEqual("aaaa");
        expect(clone.body).toEqual("test");
        expect(clone.Body).toEqual("test");
    });

    test('no records', async () => {
        const sqsConsumer: SqsConsumer = createSqsConsumerForTest();
        const transformLambdaRecordsStub = sandbox.stub(sqsConsumer, 'processMessage').returns(Promise.resolve());

        await expect(LambdaProcessQueue.handlerFn(sqsConsumer)({ Records: [] } )).resolves.toMatchObject([]);
        expect(transformLambdaRecordsStub.calledWith({})).toBe(false);
    });

    test('single valid record', async () => {
        const json = getTrackingJsonWith3Observations(getRandompId(),getRandompId());
        const record : SQSRecord = createRecord(json);

        await expect(LambdaProcessQueue.handlerFn(sqsClient)({
            Records: [record],
        })).resolves.toMatchObject( [{"status": "fulfilled", "value": undefined}]);

        const allObservations = await findAllObservations(db);
        expect(allObservations.length).toBe(3);

        let prevObservationTime = moment("2019-01-30T12:00:00+02:00").valueOf();
        for (const obs of allObservations) {
            console.info(JSON.stringify(obs));
            const observationTime = moment(obs.observationTime).valueOf();
            expect(observationTime).toBeGreaterThan(prevObservationTime);
            prevObservationTime = observationTime;
            console.info("epoc: ", observationTime);
        }
    });

    test('two valid records', async () => {
        // Create two records
        const json1 = getTrackingJsonWith3Observations(getRandompId(), getRandompId());
        const record1 : SQSRecord = createRecord(json1);
        const json2 = getTrackingJsonWith3Observations(getRandompId(), getRandompId());
        const record2 : SQSRecord = createRecord(json2);

        await expect(LambdaProcessQueue.handlerFn(sqsClient)({
            Records: [record1, record2],
        })).resolves.toMatchObject( [{"status": "fulfilled", "value": undefined}, {"status": "fulfilled", "value": undefined}]);

        const allObservations = await findAllObservations(db);
        expect(allObservations.length).toBe(6);

        let prevObservationTime = moment("2019-01-30T12:00:00+02:00").valueOf();
        for (const obs of allObservations) {
            const observationTime = moment(obs.observationTime).valueOf();
            expect(observationTime).toBeGreaterThanOrEqual(prevObservationTime);
            prevObservationTime = observationTime;
        }
    });

    test('invalid record', async () => {
        const json = `invalid json ` + getTrackingJsonWith3Observations(getRandompId(), getRandompId());
        const record : SQSRecord = createRecord(json);

        await expect(LambdaProcessQueue.handlerFn(sqsClient)({
            Records: [record],
        })).resolves.toMatchObject( [{"status": "fulfilled", "value": undefined}]);

        const allObservations = await findAllObservations(db);
        expect(allObservations.length).toBe(0);
    });

    test('invalid and valid record', async () => {
        // Create two records
        const invalidJson = `invalid json ` + getTrackingJsonWith3Observations(getRandompId(), getRandompId());
        const invalidRecord : SQSRecord = createRecord(invalidJson);

        const validJson = getTrackingJsonWith3Observations(getRandompId(), getRandompId());
        const validRecord : SQSRecord = createRecord(validJson);

        await expect(LambdaProcessQueue.handlerFn(sqsClient)({
            Records: [invalidRecord, validRecord],
        })).resolves.toMatchObject( [{"status": "fulfilled", "value": undefined}, {"status": "fulfilled", "value": undefined}]);

        const allObservations = await findAllObservations(db);
        expect(allObservations.length).toBe(3);

        let prevObservationTime = moment("2019-01-30T12:00:00+02:00").valueOf();
        for (const obs of allObservations) {
            const observationTime = moment(obs.observationTime).valueOf();
            expect(observationTime).toBeGreaterThan(prevObservationTime);
            prevObservationTime = observationTime;
        }
    });

    test('invalid record missing sending system', async () => {
        const invalidJson = getTrackingJsonWith3ObservationsAndMissingSendingSystem(getRandompId(), getRandompId());
        const record : SQSRecord = createRecord(invalidJson);

        await LambdaProcessQueue.handlerFn(sqsClient)({
            Records: [record],
        });

        const allObservations = await findAllObservations(db);
        expect(allObservations.length).toBe(3);

        for (const entry of allObservations) {
            expect(entry.sendingSystem).toEqual('UNKNOWN');
        }
    });
}));

function createRecord(trackingJson = ''): SQSRecord {
    return {
        body: trackingJson,
        messageId: '',
        receiptHandle: `s3://${process.env[MaintenanceTrackingEnvKeys.SQS_BUCKET_NAME]}/${QUEUE}/${getRandompId()}`,
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
        awsRegion: '',
    };
}