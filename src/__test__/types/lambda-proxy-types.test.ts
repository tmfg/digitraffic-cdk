import type { APIGatewayProxyResult } from "aws-lambda";
import { LambdaProxyResponseBuilder } from "../../aws/types/lambda-proxy-types.js";
import { MediaType } from "../../aws/types/mediatypes.js";
import { decodeBase64ToUtf8 } from "../../utils/base64.js";
// About 18 MB will be compressed to 2 MB
export const TEST_BIG_JSON = {
  items: Array.from({ length: 10 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    description: "This is a test description that repeats to allow compression",
    value: Math.random(),
  })),
};

describe("lambda-response", () => {
  const TEST_MESSAGE = "HELLO";
  const TEST_COUNT = 12;
  const TEST_FILENAME = "file.txt";
  const TEST_TIMESTAMP = new Date();
  const TEST_TIMESTAMP_STR = TEST_TIMESTAMP.toISOString();

  const TEST_JSON = {
    message: TEST_MESSAGE,
    count: TEST_COUNT,
  };

  function isCompressed(response: APIGatewayProxyResult): boolean {
    return response.headers?.["Content-Encoding"] === "gzip";
  }

  function assertContent(
    response: APIGatewayProxyResult,
    expectedBody: string | object,
    expectedStatus: number,
    expectedFilename?: string,
    expectedTimestamp?: Date,
    expectContentType: MediaType = MediaType.APPLICATION_JSON,
    compressed: boolean = false,
    isBase64Encoded: boolean = false,
  ): void {
    const isBinary = typeof expectedBody !== "string";
    const decodedBody = response.isBase64Encoded
      ? decodeBase64ToUtf8(response.body, isCompressed(response))
      : response.body;
    const body = isBinary ? JSON.parse(decodedBody) : decodedBody;

    expect(body).toEqual(expectedBody);
    // compressed responses are always base64 encoded
    expect(response.isBase64Encoded).toEqual(compressed || isBase64Encoded);
    expect(response.statusCode).toEqual(expectedStatus);

    if (expectedFilename) {
      expect(response.headers?.["Content-Disposition"]).toEqual(
        `attachment; filename="${expectedFilename}"`,
      );
    } else {
      expect(response.headers?.["Content-Disposition"]).toBeUndefined();
    }

    if (expectedTimestamp) {
      expect(response.headers?.["Last-Modified"]).toEqual(
        expectedTimestamp?.toUTCString(),
      );
    } else {
      expect(response.headers?.["Last-Modified"]).toBeUndefined();
    }

    if (compressed) {
      expect(response.headers?.["Content-Encoding"]).toEqual("gzip");
    } else {
      // No content-encoding header for uncompressed content
      expect(response.headers?.["Content-Encoding"]).toBeUndefined();
    }

    expect(response.headers?.["Content-Type"]).toEqual(expectContentType);
  }

  test("okJson - create json", () => {
    const response = LambdaProxyResponseBuilder.create(TEST_JSON).build();

    assertContent(response, TEST_JSON, 200);
  });

  test("okJson - with json", () => {
    const response = LambdaProxyResponseBuilder.create()
      .withBody(TEST_JSON)
      .build();

    assertContent(response, TEST_JSON, 200);
  });

  test("okJson - with json and fileName", () => {
    const response = LambdaProxyResponseBuilder.create()
      .withBody(TEST_JSON)
      .withFileName(TEST_FILENAME)
      .build();

    assertContent(response, TEST_JSON, 200, TEST_FILENAME);
  });

  test("okJson - with json, fileName and timestamp", () => {
    const response = LambdaProxyResponseBuilder.create()
      .withBody(TEST_JSON)
      .withFileName(TEST_FILENAME)
      .withTimestamp(TEST_TIMESTAMP)
      .build();

    const response2 = LambdaProxyResponseBuilder.create()
      .withBody(TEST_JSON)
      .withFileName(TEST_FILENAME)
      .withTimestamp(TEST_TIMESTAMP_STR)
      .build();

    assertContent(response, TEST_JSON, 200, TEST_FILENAME, TEST_TIMESTAMP);
    assertContent(response2, TEST_JSON, 200, TEST_FILENAME, TEST_TIMESTAMP);
  });

  test("okBinary - create binary, fileName and timestamp", () => {
    const response = LambdaProxyResponseBuilder.create(
      Buffer.from(TEST_MESSAGE).toString("base64"),
      true,
    )
      .withFileName(TEST_FILENAME)
      .withTimestamp(TEST_TIMESTAMP)
      .withContentType(MediaType.TEXT_PLAIN)
      .build();

    assertContent(
      response,
      TEST_MESSAGE,
      200,
      TEST_FILENAME,
      TEST_TIMESTAMP,
      MediaType.TEXT_PLAIN,
      false,
      true,
    );
  });

  test("badRequest", () => {
    const response = LambdaProxyResponseBuilder.badRequest(TEST_MESSAGE);

    assertContent(
      response,
      TEST_MESSAGE,
      400,
      undefined,
      undefined,
      MediaType.TEXT_PLAIN,
    );
  });

  test("notFound", () => {
    const response = LambdaProxyResponseBuilder.notFound();

    assertContent(
      response,
      "Not Found",
      404,
      undefined,
      undefined,
      MediaType.TEXT_PLAIN,
    );
  });

  test("internalError", () => {
    const response = LambdaProxyResponseBuilder.internalError();

    assertContent(
      response,
      "Internal Error",
      500,
      undefined,
      undefined,
      MediaType.TEXT_PLAIN,
    );
  });

  test("notImplemented", () => {
    const response = LambdaProxyResponseBuilder.notImplemented();

    assertContent(
      response,
      "Not Implemented",
      501,
      undefined,
      undefined,
      MediaType.TEXT_PLAIN,
    );
  });

  test("notImplemented", () => {
    const response = LambdaProxyResponseBuilder.unauthorized();

    assertContent(
      response,
      "Unauthorized",
      401,
      undefined,
      undefined,
      MediaType.TEXT_PLAIN,
    );
  });

  test("okText - with fileName and timestamp", () => {
    const response = LambdaProxyResponseBuilder.create()
      .withBody(TEST_MESSAGE)
      .withFileName(TEST_FILENAME)
      .withTimestamp(TEST_TIMESTAMP)
      .build();

    assertContent(response, TEST_MESSAGE, 200, TEST_FILENAME, TEST_TIMESTAMP);
  });

  test("okJson - compression uneffective for small json", () => {
    const response = LambdaProxyResponseBuilder.create()
      .withBody(TEST_JSON)
      .withFileName(TEST_FILENAME)
      .withTimestamp(TEST_TIMESTAMP)
      .withCompression()
      .withDebug()
      .build();

    assertContent(
      response,
      TEST_JSON,
      200,
      TEST_FILENAME,
      TEST_TIMESTAMP,
      MediaType.APPLICATION_JSON,
      false,
    );
  });

  test("okJson - compression effective for large json", () => {
    const response = LambdaProxyResponseBuilder.create()
      .withBody(TEST_BIG_JSON)
      .withFileName(TEST_FILENAME)
      .withTimestamp(TEST_TIMESTAMP)
      .withCompression()
      .withDebug()
      .build();

    assertContent(
      response,
      TEST_BIG_JSON,
      200,
      TEST_FILENAME,
      TEST_TIMESTAMP,
      MediaType.APPLICATION_JSON,
      true,
    );
  });

  test("okText - as binary", () => {
    const response = LambdaProxyResponseBuilder.create()
      .withBody(Buffer.from(TEST_MESSAGE).toString("base64"), true)
      .withFileName(TEST_FILENAME)
      .withTimestamp(TEST_TIMESTAMP)
      .withContentType(MediaType.TEXT_PLAIN)
      .build();

    assertContent(
      response,
      TEST_MESSAGE,
      200,
      TEST_FILENAME,
      TEST_TIMESTAMP,
      MediaType.TEXT_PLAIN,
      false,
      true,
    );
  });
});
