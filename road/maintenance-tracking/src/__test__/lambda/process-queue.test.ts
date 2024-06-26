import { setEnv } from "../test-env.js";
import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { type SQSRecord } from "aws-lambda";
import { parseISO } from "date-fns";
import { type SqsConsumer } from "sns-sqs-big-payload";
import { MaintenanceTrackingEnvKeys } from "../../keys.js";
import { jest } from "@jest/globals";
import { getSqsConsumerInstance } from "../../service/sqs-big-payload.js";
import { dbTestBase, findAllObservations, mockSecrets } from "../db-testutil.js";
import {
    getRandompId,
    getTrackingJsonWith3Observations,
    getTrackingJsonWith3ObservationsAndMissingSendingSystem
} from "../testdata.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

setEnv();

const QUEUE = "MaintenanceTrackingQueue";

const {
    cloneRecordWithCamelAndPascal,
    handlerFn
} = await import("../../lambda/process-queue/process-queue.js");

describe(
    "process-queue",
    dbTestBase((db: DTDatabase) => {

        beforeEach(() => {
            getSqsConsumerInstance(true); // create new consumer for each test
            mockSecrets({});
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        test("clone record", () => {
            const clone = cloneRecordWithCamelAndPascal({
                messageId: "aaaa",
                Body: "test"
            });
            // eslint-disable-next-line
            expect(clone["messageId"]).toEqual("aaaa");
            // eslint-disable-next-line
            expect(clone["MessageId"]).toEqual("aaaa");
            // eslint-disable-next-line
            expect(clone["body"]).toEqual("test");
            // eslint-disable-next-line
            expect(clone["Body"]).toEqual("test");
        });

        test("no records", async () => {
            const sqsConsumer: SqsConsumer = getSqsConsumerInstance();
            const transformLambdaRecordsStub =
                jest.spyOn(sqsConsumer, "processMessage").mockReturnValue(Promise.resolve());

            await expect(handlerFn()({ Records: [] })).resolves.toMatchObject([]);
            expect(transformLambdaRecordsStub).not.toHaveBeenCalledWith({});
        });

        test("single valid record", async () => {
            const json = getTrackingJsonWith3Observations(getRandompId(), getRandompId());
            const record: SQSRecord = createRecord(json);

            await expect(
                handlerFn()({
                    Records: [record]
                })
            ).resolves.toMatchObject([{ status: "fulfilled", value: undefined }]);

            const allObservations = await findAllObservations(db);
            expect(allObservations.length).toBe(3);

            let prevObservationTime = parseISO("2019-01-30T12:00:00+02:00").valueOf();
            for (const obs of allObservations) {
                logger.debug(JSON.stringify(obs));
                const observationTime = obs.observationTime.valueOf();
                expect(observationTime).toBeGreaterThan(prevObservationTime);
                prevObservationTime = observationTime;
                logger.debug(`observationTime: ${observationTime}`);
            }
        });

        test("two valid records", async () => {
            // Create two records
            const json1 = getTrackingJsonWith3Observations(getRandompId(), getRandompId());
            const record1: SQSRecord = createRecord(json1);
            const json2 = getTrackingJsonWith3Observations(getRandompId(), getRandompId());
            const record2: SQSRecord = createRecord(json2);

            await expect(
                handlerFn()({
                    Records: [record1, record2]
                })
            ).resolves.toMatchObject([
                { status: "fulfilled", value: undefined },
                { status: "fulfilled", value: undefined }
            ]);

            const allObservations = await findAllObservations(db);
            expect(allObservations.length).toBe(6);

            let prevObservationTime = parseISO("2019-01-30T12:00:00+02:00").valueOf();
            for (const obs of allObservations) {
                const observationTime = obs.observationTime.valueOf();
                expect(observationTime).toBeGreaterThanOrEqual(prevObservationTime);
                prevObservationTime = observationTime;
            }
        });

        test("invalid record", async () => {
            const json = `invalid json ` + getTrackingJsonWith3Observations(getRandompId(), getRandompId());
            const record: SQSRecord = createRecord(json);

            await expect(
                handlerFn()({
                    Records: [record]
                })
            ).resolves.toMatchObject([{ status: "fulfilled", value: undefined }]);

            const allObservations = await findAllObservations(db);
            expect(allObservations.length).toBe(0);
        });

        test("invalid and valid record", async () => {
            // Create two records
            const invalidJson =
                `invalid json ` + getTrackingJsonWith3Observations(getRandompId(), getRandompId());
            const invalidRecord: SQSRecord = createRecord(invalidJson);

            const validJson = getTrackingJsonWith3Observations(getRandompId(), getRandompId());
            const validRecord: SQSRecord = createRecord(validJson);

            await expect(
                handlerFn()({
                    Records: [invalidRecord, validRecord]
                })
            ).resolves.toMatchObject([
                { status: "fulfilled", value: undefined },
                { status: "fulfilled", value: undefined }
            ]);

            const allObservations = await findAllObservations(db);
            expect(allObservations.length).toBe(3);

            let prevObservationTime = parseISO("2019-01-30T12:00:00+02:00").valueOf();
            for (const obs of allObservations) {
                const observationTime = obs.observationTime.valueOf();
                expect(observationTime).toBeGreaterThan(prevObservationTime);
                prevObservationTime = observationTime;
            }
        });

        test("invalid record missing sending system", async () => {
            const invalidJson = getTrackingJsonWith3ObservationsAndMissingSendingSystem(
                getRandompId(),
                getRandompId()
            );
            const record: SQSRecord = createRecord(invalidJson);

            await handlerFn()({
                Records: [record]
            });

            const allObservations = await findAllObservations(db);
            expect(allObservations.length).toBe(3);

            for (const entry of allObservations) {
                expect(entry.sendingSystem).toEqual("UNKNOWN");
            }
        });
    })
);

function createRecord(trackingJson: string = ""): SQSRecord {
    return {
        body: trackingJson,
        messageId: "",
        receiptHandle: `s3://${getEnvVariable(
            MaintenanceTrackingEnvKeys.SQS_BUCKET_NAME
        )}/${QUEUE}/${getRandompId()}`,
        messageAttributes: {},
        md5OfBody: "",
        attributes: {
            ApproximateReceiveCount: "",
            SentTimestamp: "",
            SenderId: "",
            ApproximateFirstReceiveTimestamp: ""
        },
        eventSource: "",
        eventSourceARN: "",
        awsRegion: ""
    };
}
