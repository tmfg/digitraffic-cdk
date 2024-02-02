import * as RequestsService from "../../service/requests.js";
import { newServiceRequest } from "../testdata.js";
import { dbTestBase, insertServiceRequest } from "../db-testutil.js";
import type { ServiceRequestWithExtensions } from "../../model/service-request.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";

describe(
    "requests-service",
    dbTestBase((db: DTDatabase) => {
        test("toServiceRequest", () => {
            const originalSr = newServiceRequest();

            const convertedSr = RequestsService.toServiceRequest(originalSr);
            deleteExtensionProps(originalSr);

            expect(convertedSr).toMatchObject(originalSr);
        });

        test("toServiceRequestWithExtensions", () => {
            const originalSr = newServiceRequest();

            const convertedSr = RequestsService.toServiceRequestWithExtensions(originalSr);
            addNestedExtensionProps(originalSr);
            deleteExtensionProps(originalSr);

            expect(convertedSr).toMatchObject(originalSr);
        });

        test("findAll - no extensions", async () => {
            const sr = newServiceRequest();
            await insertServiceRequest(db, [sr]);

            const foundServiceRequests = await RequestsService.findAll(false);

            expect(foundServiceRequests[0]).toMatchObject(RequestsService.toServiceRequest(sr));
        });

        test("findAll - with extensions", async () => {
            const sr = newServiceRequest();
            await insertServiceRequest(db, [sr]);

            const foundServiceRequests = await RequestsService.findAll(true);

            expect(foundServiceRequests[0]).toMatchObject(RequestsService.toServiceRequestWithExtensions(sr));
        });

        test("delete", async () => {
            const sr = newServiceRequest();
            await insertServiceRequest(db, [sr]);

            await RequestsService.doDelete(sr.service_request_id);
            const foundServiceRequests = await RequestsService.findAll(true);

            expect(foundServiceRequests.length).toBe(0);
        });
    })
);

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
    delete (r as any).status_id;
    delete (r as any).vendor_status;
    delete (r as any).title;
    delete (r as any).service_object_id;
    delete (r as any).service_object_type;
    delete (r as any).media_urls;
    delete (r as any).subject_id;
    delete (r as any).subSubject_id;
}
