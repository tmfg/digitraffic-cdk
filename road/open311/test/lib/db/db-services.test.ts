import * as pgPromise from "pg-promise";
import {find, findAll, update} from "../../../lib/db/db-services";
import {newService} from "../testdata";
import {dbTestBase} from "../db-testutil";

describe('db-services', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('findAll', async () => {
        const services = Array.from({length: Math.floor(Math.random() * 10)}).map(() => {
            return newService();
        });
        await update(services, db);

        const foundservices = await findAll(db);

        // TODO match object, date millisecond difference
        expect(foundservices.length).toBe(services.length);
    });

    test('find - found', async () => {
        const service = newService();
        await update([service], db);

        const foundservice = await find(service.service_code, db);

        expect(foundservice).toMatchObject(service);
    });

    test('find - not found', async () => {
        const foundservice = await find('lol', db);

        expect(foundservice).toBeNull();
    });

    test('update - deletes previous', async () => {
        const previousService = newService();
        await update([previousService], db);

        const theNewService = newService();
        await update([theNewService], db);

        const foundServices = await findAll(db);

        expect(foundServices.length).toBe(1);
        expect(foundServices[0]).toMatchObject(theNewService);
    });

}));