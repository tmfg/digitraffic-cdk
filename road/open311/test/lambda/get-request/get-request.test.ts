import {handler} from "../../../lib/lambda/get-request/lambda-get-request";
import {newServiceRequest} from "../../testdata";
import {dbTestBase, insertServiceRequest} from "../../db-testutil";
import {NOT_FOUND_MESSAGE} from "digitraffic-common/aws/types/errors";

// test file
/* eslint-disable camelcase */

describe('lambda-get-request', dbTestBase((db) => {

    test('Not found throws error', () => {
        expect(handler({
            request_id: '123',
            extensions: 'false',
        })).rejects.toEqual(new Error(NOT_FOUND_MESSAGE));
    });

    test('Get with extensions', async () => {
        const sr = newServiceRequest();
        await insertServiceRequest(db, [sr]);

        const response = await handler({
            request_id: sr.service_request_id,
            extensions: 'true',
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((response as any).extended_attributes).toBeDefined();
    });

    test('Get with no extensions', async () => {
        const sr = newServiceRequest();
        await insertServiceRequest(db, [sr]);

        const response = await handler({
            request_id: sr.service_request_id,
            extensions: 'false',
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((response as any).extended_attributes).toBeUndefined();
    });

}));