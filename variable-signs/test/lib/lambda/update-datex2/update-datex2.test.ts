import * as pgPromise from "pg-promise"
import {handler} from "../../../../lib/lambda/update-datex2/lambda-update-datex2"
import {dbTestBase} from "../../db-testutil"
import {readFileSync} from 'fs'

describe('lambda-update-datex2-service', dbTestBase((db: pgPromise.IDatabase<any,any>) => {
    test('update_valid_datex2', async () => {
        const request = getRequest('valid_datex2.xml');
        const response = await handler(request);

        expect(response.statusCode).toBe(200);
    });

    test('update_valid_datex2_without_body', async () => {
        const request = getRequest('invalid_datex2_without_body.xml')
        const response = await handler(request);

        expect(response.statusCode).toBe(500);
    });

    test('update_valid_datex2_without_publication', async () => {
        const request = getRequest('invalid_datex2_without_publication.xml')
        const response = await handler(request);

        expect(response.statusCode).toBe(400);
    });
}));

function getRequest(filename: string) {
    return {body: readFileSync('test/lib/lambda/update-datex2/' + filename, 'utf8')}
}