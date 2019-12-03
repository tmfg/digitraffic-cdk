import * as pgPromise from "pg-promise";
import {initDb} from 'digitraffic-lambda-postgres/database';
import {find, findAll, insert} from "../../../lib/db/db-services";
import {newService} from "../testdata";
import {truncate} from "../db-testutil";

var db: pgPromise.IDatabase<any, any>

beforeAll(async () => {
   db = initDb('road', 'road', 'localhost:54322/road');
    await truncate(db);
});

beforeEach(async () => {
    await truncate(db);
});

afterEach(async () => {
    await truncate(db);
});

afterAll(async () => {
    db.$pool.end();
});

test('findAll', async () => {
    const services = Array.from({ length: Math.floor(Math.random() * 10) }).map(() => {
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
