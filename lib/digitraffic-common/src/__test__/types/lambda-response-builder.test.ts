import type { LambdaResponse } from "../../aws/types/lambda-response.js";
import { LambdaResponseBuilder } from "../../aws/types/lambda-response.js";
import { decodeBase64ToUtf8 } from "../../utils/base64.js";
import {
  TEST_FILENAME,
  TEST_JSON,
  TEST_MESSAGE,
  TEST_TIMESTAMP,
  TEST_TIMESTAMP_STR,
} from "./lambda-response.test.js";

describe("lambda-response", () => {
  function assertJson<T>(
    response: LambdaResponse,
    expectedJson: T,
    expectedStatus: number,
    expectedFilename?: string,
    expectedTimestamp?: Date,
  ): void {
    const body = JSON.parse(decodeBase64ToUtf8(response.body)) as unknown;

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
    const body = decodeBase64ToUtf8(response.body);

    expect(body).toEqual(expectedString);
    expect(response.status).toEqual(expectedStatus);
    expect(response.fileName).toEqual(expectedFilename);
    expect(response.timestamp).toEqual(expectedTimestamp?.toUTCString());
  }

  test("okJson - without fileName", () => {
    const response = LambdaResponseBuilder.create(TEST_JSON).build();

    assertJson(response, TEST_JSON, 200);
  });

  test("okJson - with fileName", () => {
    const response = LambdaResponseBuilder.create(TEST_JSON)
      .withFileName(TEST_FILENAME)
      .build();

    assertJson(response, TEST_JSON, 200, TEST_FILENAME);
  });

  test("okJson - with fileName and timestamp", () => {
    const responseWithTimestampDate = LambdaResponseBuilder.create()
      .withBody(TEST_JSON)
      .withFileName(TEST_FILENAME)
      .withTimestamp(TEST_TIMESTAMP)
      .build();

    const responseWithTimestampString = LambdaResponseBuilder.create()
      .withBody(TEST_JSON)
      .withFileName(TEST_FILENAME)
      .withTimestamp(TEST_TIMESTAMP_STR)
      .build();

    assertJson(
      responseWithTimestampDate,
      TEST_JSON,
      200,
      TEST_FILENAME,
      TEST_TIMESTAMP,
    );
    assertJson(
      responseWithTimestampString,
      TEST_JSON,
      200,
      TEST_FILENAME,
      TEST_TIMESTAMP,
    );
  });

  test("okBinary - with fileName and timestamp", () => {
    const response = LambdaResponseBuilder.create()
      .withBody(TEST_MESSAGE)
      .withFileName(TEST_FILENAME)
      .withTimestamp(TEST_TIMESTAMP)
      .build();

    assertBinary(response, TEST_MESSAGE, 200, TEST_FILENAME, TEST_TIMESTAMP);
  });

  test("badRequest", () => {
    const response = LambdaResponseBuilder.badRequest(TEST_MESSAGE);

    assertBinary(response, TEST_MESSAGE, 400);
  });

  test("notFound", () => {
    const response = LambdaResponseBuilder.notFound();

    assertBinary(response, "Not Found", 404);
  });

  test("internalError", () => {
    const response = LambdaResponseBuilder.internalError();

    assertBinary(response, "Internal Error", 500);
  });

  test("notImplemented", () => {
    const response = LambdaResponseBuilder.notImplemented();

    assertBinary(response, "Not Implemented", 501);
  });

  // Builder
  test("Builder - okJson - without fileName", () => {
    const response = LambdaResponseBuilder.create().withBody(TEST_JSON).build();

    assertJson(response, TEST_JSON, 200);
  });

  test("Builder - okJson - with fileName", () => {
    const response = LambdaResponseBuilder.create()
      .withBody(TEST_JSON)
      .withFileName(TEST_FILENAME)
      .build();

    assertJson(response, TEST_JSON, 200, TEST_FILENAME);
  });
});
