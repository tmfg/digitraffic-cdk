import { lastModifiedHeader, xAmzLastModifiedHeader, xAmzLastModifiedHeaderUpper } from "../../lambda-util.js";
import { handler } from "../../lambda/lambda-weathercam-http-headers.js";
import { createHeader } from "./request-util.js";
import { expectResponse, responseHandlerCall } from "./response-util.js";

test("last-modified from X-Amz-Meta-Last-Modified", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const cb = await responseHandlerCall(handler, {
        uri: "/moi",
        method: "GET",
        querystring: "",
        headers: {}
    }, {
        headers: createHeader(xAmzLastModifiedHeaderUpper, "value1")
    });

    expectResponse(cb, {
        headers: {
            [lastModifiedHeader]: "value1"
        }
    });
});

test("last-modified from x-amz-meta-last-modified", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const cb = await responseHandlerCall(handler, {
        uri: "/moi",
        method: "GET",
        querystring: "",
        headers: {}
    }, {
        headers: {...createHeader(xAmzLastModifiedHeaderUpper, "value1"), ...createHeader(xAmzLastModifiedHeader, "value2")}
    });

    expectResponse(cb, {
        headers: {
            [lastModifiedHeader]: "value2"
        }
    });
});