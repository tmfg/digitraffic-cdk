import { AtonEnvKeys } from "../../lib/keys";
import {
    dbTestBase,
    insert,
    insertActiveWarnings,
    TEST_ACTIVE_WARNINGS_VALID,
    TEST_ATON_SECRET,
} from "../db-testutil";
import { newFaultWithGeometry, voyagePlan } from "../testdata";
import { SQS } from "aws-sdk";
import * as sinon from "sinon";
import { SinonStub } from "sinon";
import { BAD_REQUEST_MESSAGE } from "@digitraffic/common/dist/aws/types/errors";
import { UploadVoyagePlanEvent } from "../../lib/model/upload-voyageplan-event";
import { DTDatabase } from "@digitraffic/common/dist/database/database";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";

const sandbox = sinon.createSandbox();
process.env[AtonEnvKeys.SEND_S124_QUEUE_URL] = "Value_for_test";
process.env.SECRET_ID = "";

import { handlerFn } from "../../lib/lambda/upload-voyage-plan/upload-voyage-plan";

describe(
    "upload-voyage-plan",
    dbTestBase((db: DTDatabase) => {
        beforeEach(() =>
            sandbox
                .stub(SecretHolder.prototype, "get")
                .returns(Promise.resolve(TEST_ATON_SECRET))
        );
        afterEach(() => sandbox.restore());

        test("publishes to SNS per fault id", async () => {
            const fault1 = newFaultWithGeometry(60.285807, 27.321659);
            const fault2 = newFaultWithGeometry(60.285817, 27.32166);

            await insert(db, [fault1, fault2]);
            const uploadEvent: UploadVoyagePlanEvent = {
                voyagePlan,
                callbackEndpoint: "some-endpoint",
            };
            const [sqs, sendSbtu] = makeSqsStub();

            await handlerFn(sqs)(uploadEvent);

            expect(sendSbtu.callCount).toBe(2);
        });

        test("publishes to SNS per warning id", async () => {
            await insertActiveWarnings(db, TEST_ACTIVE_WARNINGS_VALID);

            const uploadEvent: UploadVoyagePlanEvent = {
                voyagePlan,
                callbackEndpoint: "some-endpoint",
            };
            const [sqs, sendStub] = makeSqsStub();

            await handlerFn(sqs)(uploadEvent);

            expect(sendStub.callCount).toBe(2);
        });

        test("failed route parsing", async () => {
            const uploadEvent: UploadVoyagePlanEvent = {
                voyagePlan: "asdfasdf",
            };
            const [sqs] = makeSqsStub();
            const ackStub = sandbox.stub().returns(Promise.resolve());

            await expect(handlerFn(sqs)(uploadEvent)).rejects.toMatch(
                BAD_REQUEST_MESSAGE
            );

            expect(ackStub.notCalled).toBe(true);
        });
    })
);

function makeSqsStub(): [SQS, SinonStub] {
    const sqs = new SQS();
    const sendStub = sandbox.stub().returns(Promise.resolve());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    sandbox.stub(sqs, "sendMessage").returns({ promise: sendStub } as any);
    return [sqs, sendStub];
}
