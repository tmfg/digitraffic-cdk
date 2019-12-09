import * as pgPromise from "pg-promise";
import {handler} from '../../../../lib/lambda/check-orphan-requests/lambda-check-orphan-requests';
import {dbTestBase, insertServiceRequest} from "../../db-testutil";
import {newServiceRequest} from "../../testdata";
import * as aws from 'aws-sdk-mock';
import * as sinon from 'sinon';

describe('check-orphan-requests', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('check', async () => {
        await insertServiceRequest(db, [newServiceRequest()]);
        const publishSpy = sinon.spy();
        aws.mock('SNS', 'publish', publishSpy);

        await handler();

        expect(publishSpy.calledOnce);
    });

}));
