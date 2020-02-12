import * as pgPromise from "pg-promise";
import {dbTestBase, insertServiceRequest} from "../../db-testutil";
import {newServiceRequest} from "../../testdata";
import * as sinon from 'sinon';
import * as AWS from 'aws-sdk';
import {handler} from '../../../../lib/lambda/check-missing-states/lambda-check-missing-states';

describe('check-missing-states', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    test('missing state check send SNS event', async () => {
        await insertServiceRequest(db, [newServiceRequest()]);
        const publishSpy = sinon.spy();
        sandbox.stub(AWS, 'SNS').returns({
            publish: publishSpy
        });

        await handler();

        expect(publishSpy.calledOnce).toBe(true);
    });

    test('empty status_id does not send SNS event', async () => {
        await insertServiceRequest(db, [{...newServiceRequest(), ...{
                status_id: ''
        }}]);
        const publishSpy = sinon.spy();
        sandbox.stub(AWS, 'SNS').returns({
            publish: publishSpy
        });

        await handler();

        expect(publishSpy.notCalled).toBe(true);
    });

}));
