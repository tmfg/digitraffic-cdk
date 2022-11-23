import * as RequestsService from "../../lib/service/requests";
import {newServiceRequest} from "../testdata";
import {dbTestBase, insertServiceRequest} from "../db-testutil";
import {ServiceRequestWithExtensions} from "../../lib/model/service-request";
import {DTDatabase} from "@digitraffic/common/dist/database/database";

// test file
/* eslint-disable camelcase */

describe('requests-service', dbTestBase((db: DTDatabase) => {

    test('toServiceRequest', () => {
        const originalSr = newServiceRequest();

        const convertedSr = RequestsService.toServiceRequest(originalSr);
        deleteExtensionProps(originalSr);

        expect(convertedSr).toMatchObject(originalSr);
    });

    test('toServiceRequestWithExtensions', () => {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addNestedExtensionProps(r: any) {
    r.extended_attributes = {
        status_id: r.status_id,
        vendor_status: r.vendor_status,
        title: r.title,
        service_object_id: r.service_object_id,
        service_object_type: r.service_object_type,
        media_urls: r.media_urls,
        subject_id: r.subject_id,
        subSubject_id: r.subSubject_id,
    };
}

function deleteExtensionProps(r: ServiceRequestWithExtensions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (r as any).status_id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (r as any).vendor_status;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (r as any).title;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (r as any).service_object_id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (r as any).service_object_type;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (r as any).media_urls;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (r as any).subject_id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (r as any).subSubject_id;
}
