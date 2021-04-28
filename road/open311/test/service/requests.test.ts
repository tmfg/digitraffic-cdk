import * as pgPromise from "pg-promise";
import * as RequestsService from "../../lib/service/requests";
import {newServiceRequest} from "../testdata";
import {dbTestBase, insertServiceRequest} from "../db-testutil";
import {ServiceRequestWithExtensions} from "../../lib/model/service-request";

describe('requests-service', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('toServiceRequest', async () => {
        const originalSr = newServiceRequest();

        const convertedSr = RequestsService.toServiceRequest(originalSr);
        deleteExtensionProps(originalSr);

        expect(convertedSr).toMatchObject(originalSr);
    });

    test('toServiceRequestWithExtensions', async () => {
        const originalSr = newServiceRequest();

        const convertedSr = RequestsService.toServiceRequestWithExtensions(originalSr);
        addNestedExtensionProps(originalSr);
        deleteExtensionProps(originalSr);

        expect(convertedSr).toMatchObject(originalSr);
    });

    test('findAll - no extensions', async () => {
        const sr = newServiceRequest();
        await insertServiceRequest(db, [sr]);

        const foundServiceRequests = await RequestsService.findAll(false);

        expect(foundServiceRequests[0]).toMatchObject(RequestsService.toServiceRequest(sr));
    });

    test('findAll - with extensions', async () => {
        const sr = newServiceRequest();
        await insertServiceRequest(db, [sr]);

        const foundServiceRequests = await RequestsService.findAll(true);

        expect(foundServiceRequests[0]).toMatchObject(RequestsService.toServiceRequestWithExtensions(sr));
    });

    test('delete', async () => {
        const sr = newServiceRequest();
        await insertServiceRequest(db, [sr]);

        await RequestsService.doDelete(sr.service_request_id);
        const foundServiceRequests = await RequestsService.findAll(true);

        expect(foundServiceRequests.length).toBe(0);
    });

}));

function addNestedExtensionProps(r: any) {
    r.extended_attributes = {
        status_id: r.status_id,
        vendor_status: r.vendor_status,
        title: r.title,
        service_object_id: r.service_object_id,
        service_object_type: r.service_object_type,
        media_urls: r.media_urls,
        subject_id: r.subject_id,
        subSubject_id: r.subSubject_id
    };
}

function deleteExtensionProps(r: ServiceRequestWithExtensions) {
    // @ts-ignore
    delete r.status_id;
    // @ts-ignore
    delete r.vendor_status;
    // @ts-ignore
    delete r.title;
    // @ts-ignore
    delete r.service_object_id;
    // @ts-ignore
    delete r.service_object_type;
    // @ts-ignore
    delete r.media_urls;
    // @ts-ignore
    delete r.subject_id;
    // @ts-ignore
    delete r.subSubject_id;
}
