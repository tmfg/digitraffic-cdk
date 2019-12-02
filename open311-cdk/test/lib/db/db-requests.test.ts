import * as pgPromise from "pg-promise";
import {initDb} from 'digitraffic-lambda-postgres/database';
import {findAll, insert, update} from "../../../lib/db/db-requests";
import {newServiceRequest} from "../testdata";
import {truncate} from "../db-testutils";
import {ServiceRequestStatus} from "../../../lib/model/service-request";

var db: pgPromise.IDatabase<any, any>

beforeAll(() => {
   db = initDb('road', 'road', 'localhost:54322/road');
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

test('findAll', async () => {
    const serviceRequests = Array.from({ length: Math.floor(Math.random() * 10) }).map(() => {
        return newServiceRequest();
    });
    await insert(db, serviceRequests);

    const foundServiceRequests = await findAll(db);

    // TODO match object, date millisecond difference
    expect(foundServiceRequests.length).toBe(serviceRequests.length);
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

    // TODO geometry, dates
    const updatingServiceRequest = {
        status_notes: "other status notes",
        service_name: "other service name",
        service_code: "other than 123",
        description: "other description",
        agency_responsible: "other agency",
        service_notice: "other notice",
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
    expect(foundServiceRequest.agency_responsible).toBe(updatingServiceRequest.agency_responsible);
    expect(foundServiceRequest.service_notice).toBe(updatingServiceRequest.service_notice);
    expect(foundServiceRequest.address).toBe(updatingServiceRequest.address);
    expect(foundServiceRequest.address_id).toBe(updatingServiceRequest.address_id);
    expect(foundServiceRequest.zipcode).toBe(updatingServiceRequest.zipcode);
    expect(foundServiceRequest.media_url).toBe(updatingServiceRequest.media_url);
});
