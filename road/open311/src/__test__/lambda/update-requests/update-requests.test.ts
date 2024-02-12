import { handler } from "../../../lambda/update-requests/lambda-update-requests.js";
import { newServiceRequest, newServiceRequestWithExtensionsDto } from "../../testdata.js";
import { dbTestBase, insertServiceRequest } from "../../db-testutil.js";
import { ServiceRequestStatus } from "../../../model/service-request.js";
import { toServiceRequestWithExtensions } from "../../../service/requests.js";
import type { APIGatewayEvent } from "aws-lambda";

const testEvent = await import("../../test-event.json");

describe(
    "update-requests",
    dbTestBase((db) => {
        test("No body - invalid request", async () => {
            const response = await handler({
                ...testEvent,
                body: null
            } as unknown as APIGatewayEvent);

            expect(response.statusCode).toBe(400);
        });

        test("Empty array - invalid request", async () => {
            const response = await handler({
                ...testEvent,
                body: "[]"
            } as unknown as APIGatewayEvent);

            expect(response.statusCode).toBe(400);
        });

        test("Invalid request", async () => {
            const req = newServiceRequestWithExtensionsDto();
            // @ts-ignore
            req.requested_datetime = "";

            await expect(
                handler({
                    ...testEvent,
                    body: JSON.stringify([req])
                } as unknown as APIGatewayEvent)
            ).rejects.toThrow();
        });

        test("Single service request - created", async () => {
            const response = await handler(
                Object.assign({}, testEvent, {
                    body: JSON.stringify([newServiceRequestWithExtensionsDto()])
                }) as unknown as APIGatewayEvent
            );

            expect(response.statusCode).toBe(200);
        });

        test("Single service request without extended_attributes - created", async () => {
            const response = await handler(
                Object.assign({}, testEvent, {
                    body: JSON.stringify([newServiceRequest()])
                }) as unknown as APIGatewayEvent
            );

            expect(response.statusCode).toBe(200);
        });

        test("Multiple service requests - created", async () => {
            const response = await handler(
                Object.assign({}, testEvent, {
                    body: JSON.stringify([
                        newServiceRequestWithExtensionsDto(),
                        newServiceRequestWithExtensionsDto(),
                        newServiceRequestWithExtensionsDto()
                    ])
                }) as unknown as APIGatewayEvent
            );

            expect(response.statusCode).toBe(200);
        });

        test("Single service request update - delete", async () => {
            const sr = newServiceRequestWithExtensionsDto();
            await insertServiceRequest(db, [toServiceRequestWithExtensions(sr)]);

            const response = await handler(
                Object.assign({}, testEvent, {
                    body: JSON.stringify([
                        Object.assign({}, sr, {
                            status: ServiceRequestStatus.closed
                        })
                    ])
                }) as unknown as APIGatewayEvent
            );

            expect(response.statusCode).toBe(200);
        });

        test("Single service request update - modify", async () => {
            const sr = newServiceRequestWithExtensionsDto();
            await insertServiceRequest(db, [toServiceRequestWithExtensions(sr)]);
            const changeSr = {
                ...newServiceRequestWithExtensionsDto(),
                ...{
                    status: ServiceRequestStatus.open,
                    description: "other description"
                }
            };

            const response = await handler(
                Object.assign({}, testEvent, {
                    body: JSON.stringify(changeSr)
                }) as unknown as APIGatewayEvent
            );

            expect(response.statusCode).toBe(200);
        });
    })
);
