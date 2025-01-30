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

      const convertedSr = RequestsService.toServiceRequestWithExtensions(
        originalSr,
      );
      addNestedExtensionProps(originalSr);
      deleteExtensionProps(originalSr);

      expect(convertedSr).toMatchObject(originalSr);
    });

    test("findAll - no extensions", async () => {
      const sr = newServiceRequest();
      await insertServiceRequest(db, [sr]);

      const foundServiceRequests = await RequestsService.findAll(false);

      expect(foundServiceRequests[0]).toMatchObject(
        RequestsService.toServiceRequest(sr),
      );
    });

    test("findAll - with extensions", async () => {
      const sr = newServiceRequest();
      await insertServiceRequest(db, [sr]);

      const foundServiceRequests = await RequestsService.findAll(true);

      expect(foundServiceRequests[0]).toMatchObject(
        RequestsService.toServiceRequestWithExtensions(sr),
      );
    });

    test("delete", async () => {
      const sr = newServiceRequest();
      await insertServiceRequest(db, [sr]);

      await RequestsService.doDelete(sr.service_request_id);
      const foundServiceRequests = await RequestsService.findAll(true);

      expect(foundServiceRequests.length).toBe(0);
    });
  }),
);

function addNestedExtensionProps(r: unknown): void {
  // @ts-ignore
  r.extended_attributes = {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    status_id: r.status_id,
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    vendor_status: r.vendor_status,
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    title: r.title,
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    service_object_id: r.service_object_id,
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    service_object_type: r.service_object_type,
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    media_urls: r.media_urls,
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    subject_id: r.subject_id,
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    subSubject_id: r.subSubject_id,
  };
}

function deleteExtensionProps(r: ServiceRequestWithExtensions): void {
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
