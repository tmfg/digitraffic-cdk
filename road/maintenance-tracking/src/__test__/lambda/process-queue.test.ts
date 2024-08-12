import { setTestEnv } from "../test-env.js";
import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { type ExtendedSqsClient } from "sqs-extended-client";
import { dbTestBase, findAllObservations, mockSecrets } from "../db-testutil.js";
import { parseISO } from "date-fns";
import { type ReceiveMessageCommandOutput } from "@aws-sdk/client-sqs";
import {
    createExtendedSqsClient,
    createSqsReceiveMessageCommandOutput
} from "../../service/sqs-big-payload.js";
import { jest } from "@jest/globals";
import type { SQSEvent } from "aws-lambda";
import {
    createSQSEventWithBodies,
    getRandompId,
    getTrackingJsonWith3Observations,
    getTrackingJsonWith3ObservationsAndMissingSendingSystem
} from "../testdata.js";
import _ from "lodash";

setTestEnv();
const { handlerFn } = await import("../../lambda/process-queue/process-queue.js");

let extendedSqsClient: ExtendedSqsClient;

describe(
    "process-queue",
    dbTestBase((db: DTDatabase) => {
        beforeEach(() => {
            extendedSqsClient = createExtendedSqsClient();
            mockSecrets({});
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        test("no records", async () => {
            const output: ReceiveMessageCommandOutput = {
                Messages: [],
                $metadata: {}
            };
            const extendedSqsClientStub = jest
                .spyOn(extendedSqsClient, "_processReceive")
                .mockReturnValue(Promise.resolve(output));
            const event = { Records: [] } satisfies SQSEvent;

            await expect(handlerFn(extendedSqsClient)(event)).rejects.toMatch("SQSEvent records was empty.");

            expect(extendedSqsClientStub).not.toHaveBeenCalled();
        });

        test("single valid record", async () => {
            const json = getTrackingJsonWith3Observations(getRandompId(), getRandompId());
            const event = createSQSEventWithBodies(["bigMessageInS3"]);

            // Output without big message json as it's in S3
            const outputWithRefToS3 = createSqsReceiveMessageCommandOutput(event);
            const bigOutputFromS3 = createCopyOfSqsReceiveMessageCommandOutputAndFillBody(outputWithRefToS3, [
                json
            ]);
            const extendedSqsClientStub = jest
                .spyOn(extendedSqsClient, "_processReceive")
                .mockReturnValue(Promise.resolve(bigOutputFromS3));

            await expect(handlerFn(extendedSqsClient)(event)).resolves.toMatchObject([
                { status: "fulfilled" }
            ]);

            expect(extendedSqsClientStub).toHaveBeenCalledWith(outputWithRefToS3);

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
            // Create event with two records
            const event = createSQSEventWithBodies(["json1-in-S3", "json2-in-S3"]);
            const json1 = getTrackingJsonWith3Observations(getRandompId(), getRandompId());
            const json2 = getTrackingJsonWith3Observations(getRandompId(), getRandompId());

            const outputWithRefToS3 = createSqsReceiveMessageCommandOutput(event);
            const bigOutputFromS3 = createCopyOfSqsReceiveMessageCommandOutputAndFillBody(outputWithRefToS3, [
                json1,
                json2
            ]);
            const extendedSqsClientStub = jest
                .spyOn(extendedSqsClient, "_processReceive")
                .mockReturnValue(Promise.resolve(bigOutputFromS3));

            await expect(handlerFn(extendedSqsClient)(event)).resolves.toMatchObject([
                { status: "fulfilled", value: undefined },
                { status: "fulfilled", value: undefined }
            ]);

            expect(extendedSqsClientStub).toHaveBeenCalledWith(outputWithRefToS3);

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
            const event = createSQSEventWithBodies(["bigMessageInS3"]);

            // Output without big message json as it's in S3
            const outputWithRefToS3 = createSqsReceiveMessageCommandOutput(event);
            const bigOutputFromS3 = createCopyOfSqsReceiveMessageCommandOutputAndFillBody(outputWithRefToS3, [
                json
            ]);
            const extendedSqsClientStub = jest
                .spyOn(extendedSqsClient, "_processReceive")
                .mockReturnValue(Promise.resolve(bigOutputFromS3));

            await expect(handlerFn(extendedSqsClient)(event)).resolves.toMatchObject([
                { status: "rejected" }
            ]);

            expect(extendedSqsClientStub).toHaveBeenCalledWith(outputWithRefToS3);

            const allObservations = await findAllObservations(db);
            expect(allObservations.length).toBe(0);
        });

        test("invalid and valid record", async () => {
            // Create two records
            const invalidJson =
                `invalid json ` + getTrackingJsonWith3Observations(getRandompId(), getRandompId());
            const validJson = getTrackingJsonWith3Observations(getRandompId(), getRandompId());
            const event = createSQSEventWithBodies(["invalidJsonS2Ref", "validJsonS3Ref"]);
            // Output without big message json as it's in S3
            const outputWithRefToS3 = createSqsReceiveMessageCommandOutput(event);
            const bigOutputFromS3 = createCopyOfSqsReceiveMessageCommandOutputAndFillBody(outputWithRefToS3, [
                invalidJson,
                validJson
            ]);

            const extendedSqsClientStub = jest
                .spyOn(extendedSqsClient, "_processReceive")
                .mockReturnValue(Promise.resolve(bigOutputFromS3));

            await expect(handlerFn(extendedSqsClient)(event)).resolves.toMatchObject([
                { status: "rejected" },
                { status: "fulfilled" }
            ]);

            expect(extendedSqsClientStub).toHaveBeenCalledWith(outputWithRefToS3);
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
            const event = createSQSEventWithBodies([invalidJson]);

            await handlerFn(extendedSqsClient)(event);

            const allObservations = await findAllObservations(db);
            expect(allObservations.length).toBe(3);

            for (const entry of allObservations) {
                expect(entry.sendingSystem).toEqual("UNKNOWN");
            }
        });
    })
);

function createCopyOfSqsReceiveMessageCommandOutputAndFillBody(
    outputWithRefToS3: ReceiveMessageCommandOutput,
    jsons: string[]
): ReceiveMessageCommandOutput {
    const outputValueWithBigJsonFromS3 = _.cloneDeep(outputWithRefToS3);
    jsons.forEach((json, index) => {
        if (outputValueWithBigJsonFromS3.Messages && outputValueWithBigJsonFromS3.Messages[index]) {
            _.set(outputValueWithBigJsonFromS3.Messages[index]!, "Body", json); //  Set payload from S3
        } else {
            throw new Error(`outputValueWithBigJsonFromS3.Messages[${index}] was missing`);
        }
    });
    return outputValueWithBigJsonFromS3;
}
