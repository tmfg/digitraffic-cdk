import * as pgPromise from "pg-promise";
import {dbTestBase, insertServiceRequest} from "../../db-testutil";
import {newServiceRequest} from "../../testdata";
import * as sinon from 'sinon';
import * as AWS from 'aws-sdk';
import {handler} from '../../../../lib/lambda/check-orphan-requests/lambda-check-orphan-requests';

describe('check-orphan-requests', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    test('missing service check send SNS event', async () => {
        await insertServiceRequest(db, [newServiceRequest()]);
        const publishSpy = sinon.spy();
        sandbox.stub(AWS, 'SNS').returns({
            publish: publishSpy
        });

        await handler();

        expect(publishSpy.calledOnce).toBe(true);
    });

    test('empty service does not send SNS event', async () => {
        await insertServiceRequest(db, [Object.assign(newServiceRequest(), {
            service_code: ''
        })]);
        const publishSpy = sinon.spy();
        sandbox.stub(AWS, 'SNS').returns({
            publish: publishSpy
        });

        await handler();

        expect(publishSpy.notCalled).toBe(true);
    });

}));
