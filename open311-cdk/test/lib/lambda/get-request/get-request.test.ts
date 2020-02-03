import * as pgPromise from "pg-promise";
import {handler} from "../../../../lib/lambda/get-request/lambda-get-request";
import {newServiceRequest} from "../../testdata";
import {ServiceRequestStatus} from "../../../../lib/model/service-request";
import {dbTestBase, insertServiceRequest} from "../../db-testutil";
import {NOT_FOUND_MESSAGE} from "../../../../../common/api/errors";

describe('lambda-get-request', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('Unknown request throws error', async () => {
        expect(handler({ request_id: '123' })).rejects.toEqual(new Error(NOT_FOUND_MESSAGE));
    });

    test('Get', async () => {
        const sr = Object.assign(newServiceRequest(), {
            status: ServiceRequestStatus.open
        });
        await insertServiceRequest(db, [sr]);

        const response = await handler({
            request_id: sr.service_request_id
        });

        expect(response).toMatchObject(sr);
    });

}));