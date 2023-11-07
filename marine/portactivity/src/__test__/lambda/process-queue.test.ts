// eslint-disable-next-line dot-notation
process.env["SECRET_ID"] = "Test";

import { dbTestBase, findAll, mockSecrets } from "../db-testutil";
import { handlerFn } from "../../lambda/process-queue/process-queue";
import type { SQSRecord } from "aws-lambda";
import type { ApiTimestamp } from "../../model/timestamp";
import { newTimestamp } from "../testdata";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import * as R from "ramda";
import * as sinon from "sinon";

describe(
    "process-queue",
    dbTestBase((db: DTDatabase) => {
        beforeEach(() => {
            sinon.restore();
            mockSecrets({});
        });

        test("no records", async () => {
            await handlerFn()({
                Records: []
            });
        });

        test("single valid record", async () => {
            const timestamp = newTimestamp();

            await handlerFn()({
                Records: [createRecord(timestamp)]
            });

            const allTimestamps = await findAll(db);
            expect(allTimestamps.length).toBe(1);
        });

        test("missing portcall id does not throw error", async () => {
            const timestamp = R.omit(["portcallId"], newTimestamp());

            await handlerFn()({
                Records: [createRecord(timestamp)]
            });

            const allTimestamps = await findAll(db);
            expect(allTimestamps.length).toBe(0);
        });

        test("single invalid record", async () => {
            const timestamp = R.omit(["eventType"], newTimestamp()) as ApiTimestamp;

            await handlerFn()({
                Records: [createRecord(timestamp)]
            });

            const allTimestamps = await findAll(db);
            expect(allTimestamps.length).toBe(0);
        });

        test("both valid & invalid records return fulfilled promises", async () => {
            const validTimestamp = newTimestamp();
            const invalidTimestamp = R.omit(["eventType"], newTimestamp()) as ApiTimestamp;

            const promises = await handlerFn()({
                Records: [createRecord(validTimestamp), createRecord(invalidTimestamp)]
            });

            expect(
                promises.filter((p: PromiseSettledResult<unknown>) => p.status === "fulfilled")
            ).toHaveLength(2);
            const allTimestamps = await findAll(db);
            expect(allTimestamps.length).toBe(1);
        });
    })
);

function createRecord(timestamp: ApiTimestamp): SQSRecord {
    // none of these matter besides body
    return {
        body: JSON.stringify(timestamp),
        messageId: "",
        receiptHandle: "",
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
