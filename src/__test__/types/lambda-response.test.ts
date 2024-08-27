import { LambdaResponse } from "../../aws/types/lambda-response.js";

describe("lambda-response", () => {
    const TEST_MESSAGE = "HELLO";
    const TEST_COUNT = 12;
    const TEST_FILENAME = "file.txt";
    const TEST_TIMESTAMP = new Date();

    const TEST_JSON = {
        message: TEST_MESSAGE,
        count: TEST_COUNT,
    };

    function assertJson<T>(
        response: LambdaResponse,
        expectedJson: T,
        expectedStatus: number,
        expectedFilename?: string,
        expectedTimestamp?: Date,
    ): void {
        const body = JSON.parse(Buffer.from(response.body, "base64").toString()) as unknown;

        expect(body).toEqual(expectedJson);
        expect(response.status).toEqual(expectedStatus);
        expect(response.fileName).toEqual(expectedFilename);
        expect(response.timestamp).toEqual(expectedTimestamp?.toUTCString());
    }

    function assertBinary(
        response: LambdaResponse,
        expectedString: string,
        expectedStatus: number,
        expectedFilename?: string,
        expectedTimestamp?: Date,
    ): void {
        const body = Buffer.from(response.body, "base64").toString();

        expect(body).toEqual(expectedString);
        expect(response.status).toEqual(expectedStatus);
        expect(response.fileName).toEqual(expectedFilename);
        expect(response.timestamp).toEqual(expectedTimestamp?.toUTCString());
    }

    test("okJson - without fileName", () => {
        const response = LambdaResponse.okJson(TEST_JSON);

        assertJson(response, TEST_JSON, 200);
    });

    test("okJson - with fileName", () => {
        const response = LambdaResponse.okJson(TEST_JSON, TEST_FILENAME);

        assertJson(response, TEST_JSON, 200, TEST_FILENAME);
    });

    test("okJson - with fileName and timestamp", () => {
        const response = LambdaResponse.okJson(TEST_JSON, TEST_FILENAME).withTimestamp(TEST_TIMESTAMP);

        assertJson(response, TEST_JSON, 200, TEST_FILENAME, TEST_TIMESTAMP);
    });

    test("okBinary - with fileName and timestamp", () => {
        const response = LambdaResponse.okBinary(
            Buffer.from(TEST_MESSAGE).toString("base64"),
            TEST_FILENAME,
        ).withTimestamp(TEST_TIMESTAMP);

        assertBinary(response, TEST_MESSAGE, 200, TEST_FILENAME, TEST_TIMESTAMP);
    });

    test("badRequest", () => {
        const response = LambdaResponse.badRequest(TEST_MESSAGE);

        assertBinary(response, TEST_MESSAGE, 400);
    });

    test("notFound", () => {
        const response = LambdaResponse.notFound();

        assertBinary(response, "Not found", 404);
    });

    test("internalError", () => {
        const response = LambdaResponse.internalError();

        assertBinary(response, "Internal error", 500);
    });

    test("notImplemented", () => {
        const response = LambdaResponse.notImplemented();

        assertBinary(response, "Not implemented", 501);
    });
});
