import {dbTestBase, insert, insertActiveWarnings, TEST_ACTIVE_WARNINGS_VALID} from "../db-testutil";
import * as pgPromise from "pg-promise";
import {handlerFn} from '../../lib/lambda/upload-voyage-plan/upload-voyage-plan';
import {newFaultWithGeometry, voyagePlan} from "../testdata";
import {SNS} from "aws-sdk";
import * as sinon from 'sinon';
import {SinonStub} from "sinon";
import {BAD_REQUEST_MESSAGE} from "digitraffic-common/api/errors";
import {UploadVoyagePlanEvent} from "../../lib/model/upload-voyageplan-event";
import {createSecretFunction} from "../../../../digitraffic-common/test/secret";

const sandbox = sinon.createSandbox();

describe('upload-voyage-plan', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    const secretFn = createSecretFunction({});

    afterEach(() => sandbox.restore());

    test('publishes to SNS per fault id', async () => {
        const fault1 = newFaultWithGeometry(60.285807, 27.321659);
        const fault2 = newFaultWithGeometry(60.285817, 27.321660);

//        await insertActiveWarnings(db, TEST_ACTIVE_WARNINGS_VALID);
        await insert(db, [fault1, fault2]);
        const uploadEvent: UploadVoyagePlanEvent = {
            voyagePlan,
            callbackEndpoint: 'some-endpoint'
        };
        const [sns, snsPublishStub] = makeSnsPublishStub();

        await handlerFn(sns, secretFn)(uploadEvent);

        expect(snsPublishStub.callCount).toBe(2);
    });

    test('publishes to SNS per warning id', async () => {
        await insertActiveWarnings(db, TEST_ACTIVE_WARNINGS_VALID);

        const uploadEvent: UploadVoyagePlanEvent = {
            voyagePlan,
            callbackEndpoint: 'some-endpoint'
        };
        const [sns, snsPublishStub] = makeSnsPublishStub();

        await handlerFn(sns, secretFn)(uploadEvent);

        expect(snsPublishStub.callCount).toBe(2);
    });

    test('failed route parsing', async () => {
        const uploadEvent: UploadVoyagePlanEvent = {
            voyagePlan: 'asdfasdf'
        };
        const [sns] = makeSnsPublishStub();
        const ackStub = sandbox.stub().returns(Promise.resolve());

        await expect(handlerFn(sns, secretFn)(uploadEvent)).rejects.toMatch(BAD_REQUEST_MESSAGE);

        expect(ackStub.notCalled).toBe(true);
    });

}));

async function insertFault(db: pgPromise.IDatabase<any, any>) {
    const fault = newFaultWithGeometry(60.285807, 27.321659);
    await insert(db, [fault]);
}

function makeSnsPublishStub(): [SNS, SinonStub] {
    const sns = new SNS();
    const publishStub = sandbox.stub().returns(Promise.resolve());
    sandbox.stub(sns, 'publish').returns({promise: publishStub} as any);
    return [sns, publishStub];
}
