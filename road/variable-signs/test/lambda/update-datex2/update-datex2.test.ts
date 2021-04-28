import * as pgPromise from "pg-promise"
import {handler} from "../../../lib/lambda/update-datex2/lambda-update-datex2"
import {dbTestBase} from "../../db-testutil"
import {readFileSync} from 'fs'
import * as VariableSignsService from '../../../lib/service/variable-signs'

describe('lambda-update-datex2', dbTestBase((db: pgPromise.IDatabase<any,any>) => {
    test('update_valid_datex2', async () => {
        const response = await updateFile('valid_datex2.xml', 200);

        const datex2 = (await VariableSignsService.findActiveSignsDatex2()).body;

        expect(datex2).toMatch(/xml/);
        expect(datex2).toMatch(/KRM015651/);
        expect(datex2).toMatch(/KRM015511/);
    });

    test('update_valid_datex2_without_body', async () => {
        await updateFile('invalid_datex2_without_body.xml', 400);
    });

    test('update_valid_datex2_without_publication', async () => {
        await updateFile('invalid_datex2_without_publication.xml', 400);
    });

    test('insert_update', async () => {
        await updateFile('valid_datex2.xml', 200);

        const datex2 = (await VariableSignsService.findActiveSignsDatex2()).body;
        expect(datex2).toMatch(/\<overallStartTime\>2020-02-19T14:45:02.013Z<\/overallStartTime>/);

        // and then update
        await updateFile('valid_datex2_updated.xml', 200);

        const datex2_2 = (await VariableSignsService.findActiveSignsDatex2()).body;
        expect(datex2_2).toMatch(/\<overallStartTime\>2020-02-20T14:45:02.013Z<\/overallStartTime>/);

    });
}));

async function updateFile(filename: string, expectedStatusCode: number): Promise<any> {
    const request = getRequest(filename);
    const response = await handler(request);

    expect(response.statusCode).toBe(expectedStatusCode);

    return response;
}

function getRequest(filename: string): any {
    return {body: readFileSync('test/lib/lambda/update-datex2/' + filename, 'utf8')}
}