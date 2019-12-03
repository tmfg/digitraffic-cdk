import * as pgPromise from "pg-promise";
import {find, findAll, insert} from "../../../lib/db/db-services";
import {newService} from "../testdata";
import {dbTestBase} from "../db-testutil";

describe('db-services', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('findAll', async () => {
        const services = Array.from({length: Math.floor(Math.random() * 10)}).map(() => {
            return newService();
        });
        await insert(db, services);

        const foundservices = await findAll(db);

        // TODO match object, date millisecond difference
        expect(foundservices.length).toBe(services.length);
    });

    test('find - found', async () => {
        const service = newService();
        await insert(db, [service]);

        const foundservice = await find(db, service.service_code);

        expect(foundservice).toMatchObject(service);
    });

    test('find - not found', async () => {
        const foundservice = await find(db, 'lol');

        expect(foundservice).toBeNull();
    });

}));