// eslint-disable-next-line dot-notation
process.env["SECRET_ID"] = "Test";

import { dbTestBase, findAll, mockSecrets } from "../db-testutil.js";
import { handlerFn } from "../../lambda/process-queue/process-queue.js";
import type { SQSRecord } from "aws-lambda";
import type { ApiTimestamp } from "../../model/timestamp.js";
import { newTimestamp } from "../testdata.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import _ from "lodash";
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
            const timestamp = _.omit(newTimestamp(), "portcallId");

            await handlerFn()({
                Records: [createRecord(timestamp)]
            });

            const allTimestamps = await findAll(db);
            expect(allTimestamps.length).toBe(0);
        });

        test("single invalid record", async () => {
            const timestamp = _.omit(newTimestamp(), "eventType") as ApiTimestamp;

            await handlerFn()({
                Records: [createRecord(timestamp)]
            });

            const allTimestamps = await findAll(db);
            expect(allTimestamps.length).toBe(0);
        });

        test("both valid & invalid records return fulfilled promises", async () => {
            const validTimestamp = newTimestamp();
            const invalidTimestamp = _.omit(newTimestamp(), "eventType") as ApiTimestamp;

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
