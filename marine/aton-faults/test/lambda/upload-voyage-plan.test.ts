import {dbTestBase, insert, insertActiveWarnings, TEST_ACTIVE_WARNINGS_VALID, TEST_ATON_SECRET} from "../db-testutil";
import {handlerFn} from '../../lib/lambda/upload-voyage-plan/upload-voyage-plan';
import {newFaultWithGeometry, voyagePlan} from "../testdata";
import {SQS} from "aws-sdk";
import * as sinon from 'sinon';
import {SinonStub} from 'sinon';
import {BAD_REQUEST_MESSAGE} from "digitraffic-common/api/errors";
import {UploadVoyagePlanEvent} from "../../lib/model/upload-voyageplan-event";
import {AtonSecret} from "../../lib/model/secret";
import {createSecretFunction} from "digitraffic-common/test/secret";
import {DTDatabase} from "digitraffic-common/postgres/database";

const sandbox = sinon.createSandbox();

describe('upload-voyage-plan', dbTestBase((db: DTDatabase) => {
    const secretFn = createSecretFunction<AtonSecret, void>(TEST_ATON_SECRET);

    afterEach(() => sandbox.restore());

    test('publishes to SNS per fault id', async () => {
        const fault1 = newFaultWithGeometry(60.285807, 27.321659);
        const fault2 = newFaultWithGeometry(60.285817, 27.321660);

        //        await insertActiveWarnings(db, TEST_ACTIVE_WARNINGS_VALID);
        await insert(db, [fault1, fault2]);
        const uploadEvent: UploadVoyagePlanEvent = {
            voyagePlan,
            callbackEndpoint: 'some-endpoint',
        };
        const [sqs, sendSbtu] = makeSqsStub();

        await handlerFn(sqs, secretFn)(uploadEvent);

        expect(sendSbtu.callCount).toBe(2);
    });

    test('publishes to SNS per warning id', async () => {
        await insertActiveWarnings(db, TEST_ACTIVE_WARNINGS_VALID);

        const uploadEvent: UploadVoyagePlanEvent = {
            voyagePlan,
            callbackEndpoint: 'some-endpoint',
        };
        const [sqs, sendStub] = makeSqsStub();

        await handlerFn(sqs, secretFn)(uploadEvent);

        expect(sendStub.callCount).toBe(2);
    });

    test('failed route parsing', async () => {
        const uploadEvent: UploadVoyagePlanEvent = {
            voyagePlan: 'asdfasdf',
        };
        const [sqs] = makeSqsStub();
        const ackStub = sandbox.stub().returns(Promise.resolve());

        await expect(handlerFn(sqs, secretFn)(uploadEvent)).rejects.toMatch(BAD_REQUEST_MESSAGE);

        expect(ackStub.notCalled).toBe(true);
    });

}));

async function insertFault(db: DTDatabase) {
    const fault = newFaultWithGeometry(60.285807, 27.321659);
    await insert(db, [fault]);
}

function makeSqsStub(): [SQS, SinonStub] {
    const sqs = new SQS();
    const sendStub = sandbox.stub().returns(Promise.resolve());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sandbox.stub(sqs, 'sendMessage').returns({promise: sendStub} as any);
    return [sqs, sendStub];
}
