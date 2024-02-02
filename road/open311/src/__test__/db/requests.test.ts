import * as RequestsDb from "../../db/requests.js";
import { newServiceRequest } from "../testdata.js";
import { dbTestBase, insertServiceRequest } from "../db-testutil.js";
import { ServiceRequestStatus } from "../../model/service-request.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";

describe(
    "db-requests",
    dbTestBase((db: DTDatabase) => {
        test("findAll", async () => {
            const serviceRequests = Array.from({
                length: Math.floor(Math.random() * 10)
            }).map(() => {
                return newServiceRequest();
            });
            await insertServiceRequest(db, serviceRequests);

            const foundServiceRequests = await RequestsDb.findAll(db);

            // TODO match object, date millisecond difference
            expect(foundServiceRequests.length).toBe(serviceRequests.length);
        });

        test("find - found", async () => {
            const serviceRequest = newServiceRequest();
            await insertServiceRequest(db, [serviceRequest]);

            const foundServiceRequest = await RequestsDb.find(serviceRequest.service_request_id, db);

            expect(foundServiceRequest).toMatchObject(serviceRequest);
        });

        test("find - not found", async () => {
            const foundServiceRequest = await RequestsDb.find("lol", db);

            expect(foundServiceRequest).toBeNull();
        });

        test("update - delete", async () => {
            const serviceRequest = newServiceRequest();
            await insertServiceRequest(db, [serviceRequest]);

            await RequestsDb.update(
                [
                    Object.assign({}, serviceRequest, {
                        status: ServiceRequestStatus.closed
                    })
                ],
                db
            );
            const foundServiceRequests = await RequestsDb.findAll(db);

            expect(foundServiceRequests.length).toBe(0);
        });

        test("update - modify", async () => {
            const serviceRequest = newServiceRequest();
            await insertServiceRequest(db, [serviceRequest]);

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
                media_url: "other url",
                status_id: "321",
                vendor_status: "other vendor status",
                title: "another title",
                service_object_id: "another service_object_id",
                service_object_type: "another service_object_type",
                media_urls: ["http://doesnotexist.lol"],
                subject_id: 15,
                subSubject_id: 20
            };
            await RequestsDb.update([Object.assign({}, serviceRequest, updatingServiceRequest)], db);
            const foundServiceRequests = await RequestsDb.findAll(db);

            expect(foundServiceRequests.length).toBe(1);
            const foundServiceRequest = foundServiceRequests[0]!;
            expect(foundServiceRequest.status_notes).toBe(updatingServiceRequest.status_notes);
            expect(foundServiceRequest.service_name).toBe(updatingServiceRequest.service_name);
            expect(foundServiceRequest.service_code).toBe(updatingServiceRequest.service_code);
            expect(foundServiceRequest.description).toBe(updatingServiceRequest.description);
            expect(foundServiceRequest.requested_datetime).toMatchObject(
                updatingServiceRequest.requested_datetime
            );
            expect(foundServiceRequest.updated_datetime).toMatchObject(
                updatingServiceRequest.updated_datetime
            );
            expect(foundServiceRequest.expected_datetime).toMatchObject(
                updatingServiceRequest.expected_datetime
            );
            expect(foundServiceRequest.agency_responsible).toBe(updatingServiceRequest.agency_responsible);
            expect(foundServiceRequest.service_notice).toBe(updatingServiceRequest.service_notice);
            expect(foundServiceRequest.address).toBe(updatingServiceRequest.address);
            expect(foundServiceRequest.address_id).toBe(updatingServiceRequest.address_id);
            expect(foundServiceRequest.zipcode).toBe(updatingServiceRequest.zipcode);
            expect(foundServiceRequest.media_url).toBe(updatingServiceRequest.media_url);
            expect(foundServiceRequest.status_id).toBe(updatingServiceRequest.status_id);
            expect(foundServiceRequest.vendor_status).toBe(updatingServiceRequest.vendor_status);
            expect(foundServiceRequest.title).toBe(updatingServiceRequest.title);
            expect(foundServiceRequest.service_object_id).toBe(updatingServiceRequest.service_object_id);
            expect(foundServiceRequest.service_object_type).toBe(updatingServiceRequest.service_object_type);
            expect(foundServiceRequest.media_urls).toMatchObject(updatingServiceRequest.media_urls);
            expect(foundServiceRequest.subject_id).toBe(updatingServiceRequest.subject_id);
            expect(foundServiceRequest.subSubject_id).toBe(updatingServiceRequest.subSubject_id);
        });

        test("update - null geometry doesn't fail", async () => {
            const serviceRequest = newServiceRequest();
            await insertServiceRequest(db, [serviceRequest]);

            const updatingServiceRequest = Object.assign({}, serviceRequest);
            delete (updatingServiceRequest as any).long;
            delete (updatingServiceRequest as any).lat;

            await RequestsDb.update([updatingServiceRequest], db);
        });

        test("update - invalid geometry is not saved", async () => {
            const serviceRequest = newServiceRequest();
            await insertServiceRequest(db, [serviceRequest]);

            const updatingServiceRequest = Object.assign({}, serviceRequest);
            (updatingServiceRequest as any).long = "";
            (updatingServiceRequest as any).lat = "";

            await RequestsDb.update([updatingServiceRequest], db);

            const foundServiceRequest = (await RequestsDb.findAll(db))[0]!;
            expect(foundServiceRequest.long).toBeNull();
            expect(foundServiceRequest.lat).toBeNull();
        });

        test("Insert", async () => {
            const serviceRequests = Array.from({
                length: Math.floor(Math.random() * 10)
            }).map(() => {
                return newServiceRequest();
            });

            await RequestsDb.update(serviceRequests, db);
            const foundServiceRequests = await RequestsDb.findAll(db);

            expect(foundServiceRequests.length).toBe(serviceRequests.length);
        });

        test("Insert - null geometry doesn't fail", async () => {
            const serviceRequest = newServiceRequest();
            delete (serviceRequest as any).long;
            delete (serviceRequest as any).lat;

            await RequestsDb.update([serviceRequest], db);
        });

        test("insert - invalid geometry is not saved", async () => {
            const serviceRequest = newServiceRequest();
            (serviceRequest as any).long = "";
            (serviceRequest as any).lat = "";

            await RequestsDb.update([serviceRequest], db);

            const foundServiceRequest = (await RequestsDb.findAll(db))[0]!;
            expect(foundServiceRequest.long).toBeNull();
            expect(foundServiceRequest.lat).toBeNull();
        });

        test("Delete - missing doesn't fail", async () => {
            await RequestsDb.doDelete("foo", db);
        });

        test("Delete", async () => {
            const serviceRequests = Array.from({
                length: 1 + Math.floor(Math.random() * 10)
            }).map(() => {
                return newServiceRequest();
            });
            await insertServiceRequest(db, serviceRequests);

            const srIdToDelete = serviceRequests[0]!.service_request_id;
            await RequestsDb.doDelete(srIdToDelete, db);

            const foundServiceRequests = await RequestsDb.findAll(db);

            expect(foundServiceRequests.find((sr) => sr.service_request_id === srIdToDelete)).toBeUndefined();
        });
    })
);
