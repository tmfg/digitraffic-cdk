import * as pgPromise from "pg-promise"
import {handler} from "../../../../lib/lambda/update-datex2/lambda-update-datex2"
import {dbTestBase} from "../../db-testutil"
import {readFileSync} from 'fs'
import {findActiveSignsDatex2} from "../../../../lib/service/variable-sign-service";

describe('lambda-update-datex2', dbTestBase((db: pgPromise.IDatabase<any,any>) => {
    test('update_valid_datex2', async () => {
        const request = getRequest('valid_datex2.xml');
        const response = await handler(request);

        expect(response.statusCode).toBe(200);

        const datex2 = (await findActiveSignsDatex2()).body;

        console.log("datex2 " + datex2);

        expect(datex2).toMatch(/xml/);
        expect(datex2).toMatch(/KRM015651/);
        expect(datex2).toMatch(/KRM015511/);
    });

    test('update_valid_datex2_without_body', async () => {
        const request = getRequest('invalid_datex2_without_body.xml')
        const response = await handler(request);

        expect(response.statusCode).toBe(400);
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