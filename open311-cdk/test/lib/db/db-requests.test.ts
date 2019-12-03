import * as pgPromise from "pg-promise";
import {initDb} from 'digitraffic-lambda-postgres/database';
import {find, findAll, insert, update} from "../../../lib/db/db-requests";
import {newServiceRequest} from "../testdata";
import {truncate} from "../db-testutil";
import {ServiceRequestStatus} from "../../../lib/model/service-request";

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

test('Insert', async () => {
    const serviceRequests = Array.from({ length: Math.floor(Math.random() * 10) }).map(() => {
        return newServiceRequest();
    });

    await insert(db, serviceRequests);
    const foundServiceRequests = await findAll(db);

    expect(foundServiceRequests.length).toBe(serviceRequests.length);
});

test("Insert - null geometry doesn't fail", async () => {
    const serviceRequest = newServiceRequest();
    // @ts-ignore
    delete serviceRequest.long;
    // @ts-ignore
    delete serviceRequest.lat;

    await insert(db, [serviceRequest]);
});

test('findAll', async () => {
    const serviceRequests = Array.from({ length: Math.floor(Math.random() * 10) }).map(() => {
        return newServiceRequest();
    });
    await insert(db, serviceRequests);

    const foundServiceRequests = await findAll(db);

    // TODO match object, date millisecond difference
    expect(foundServiceRequests.length).toBe(serviceRequests.length);
});

test('find - found', async () => {
    const serviceRequest = newServiceRequest();
    await insert(db, [serviceRequest]);

    const foundServiceRequest = await find(db, serviceRequest.service_request_id);

    expect(foundServiceRequest).toMatchObject(serviceRequest);
});

test('find - not found', async () => {
    const foundServiceRequest = await find(db, 'lol');

    expect(foundServiceRequest).toBeNull();
});

test('update - delete', async () => {
    const serviceRequest = Object.assign(newServiceRequest(), {
        status: ServiceRequestStatus.open
    });
    await insert(db, [serviceRequest]);

    await update(db, [Object.assign({}, serviceRequest, {
        status: ServiceRequestStatus.closed
    })]);
    const foundServiceRequests = await findAll(db);

    expect(foundServiceRequests.length).toBe(0);
});

test('update - modify', async () => {
    const serviceRequest = Object.assign(newServiceRequest(), {
        status: ServiceRequestStatus.open
    });
    await insert(db, [serviceRequest]);

    // round off millis
    const requested_datetime = new Date();
    requested_datetime.setMilliseconds(0);
    const updated_datetime = new Date();
    updated_datetime.setMilliseconds(0);
    const expected_datetime = new Date();
    expected_datetime.setMilliseconds(0);
    const updatingServiceRequest = {
        status_notes: "other status notes",
        service_name: "other service name",
        service_code: "other than 123",
        description: "other description",
        agency_responsible: "other agency",
        service_notice: "other notice",
        requested_datetime,
        updated_datetime,
        expected_datetime,
        address: "other address",
        address_id: "other than 2",
        zipcode: "other than 123456",
        media_url: "other url"
    };
    await update(db, [Object.assign({}, serviceRequest, updatingServiceRequest)]);
    const foundServiceRequests = await findAll(db);

    expect(foundServiceRequests.length).toBe(1);
    const foundServiceRequest = foundServiceRequests[0];
    expect(foundServiceRequest.status_notes).toBe(updatingServiceRequest.status_notes);
    expect(foundServiceRequest.service_name).toBe(updatingServiceRequest.service_name);
    expect(foundServiceRequest.service_code).toBe(updatingServiceRequest.service_code);
    expect(foundServiceRequest.description).toBe(updatingServiceRequest.description);
    expect(foundServiceRequest.requested_datetime).toMatchObject(updatingServiceRequest.requested_datetime);
    expect(foundServiceRequest.updated_datetime).toMatchObject(updatingServiceRequest.updated_datetime);
    expect(foundServiceRequest.expected_datetime).toMatchObject(updatingServiceRequest.expected_datetime);
    expect(foundServiceRequest.agency_responsible).toBe(updatingServiceRequest.agency_responsible);
    expect(foundServiceRequest.service_notice).toBe(updatingServiceRequest.service_notice);
    expect(foundServiceRequest.address).toBe(updatingServiceRequest.address);
    expect(foundServiceRequest.address_id).toBe(updatingServiceRequest.address_id);
    expect(foundServiceRequest.zipcode).toBe(updatingServiceRequest.zipcode);
    expect(foundServiceRequest.media_url).toBe(updatingServiceRequest.media_url);
});

test("update - null geometry doesn't fail", async () => {
    const serviceRequest = Object.assign(newServiceRequest(), {
        status: ServiceRequestStatus.open
    });
    await insert(db, [serviceRequest]);

    const updatingServiceRequest = Object.assign({}, serviceRequest);
    // @ts-ignore
    delete updatingServiceRequest.long;
    // @ts-ignore
    delete updatingServiceRequest.lat;
    await update(db, [updatingServiceRequest]);
});
