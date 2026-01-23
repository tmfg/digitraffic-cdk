import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { jest } from "@jest/globals";

jest.spyOn(SecretHolder.prototype, "get").mockImplementation(() =>
  Promise.resolve({
    s3DomainTmsRawOngoing: "s3domain",
    snowflakeDomain: "snowflakedomain",
  }),
);

import type { CloudFrontS3Origin } from "aws-lambda";
import { handler, PATHS } from "../../lambda/lambda-lam-redirect.js";
import { expectRequest, requestHandlerCall } from "./request-util.js";
import { expectResponse } from "./response-util.js";

function createFileName(year: number): string {
  return `lamraw_1234_${year}_1.csv`;
}

function isCloudFrontResultResponse(
  obj: unknown,
): obj is import("aws-lambda").CloudFrontResultResponse {
  return obj !== null && typeof obj === "object" && "status" in obj;
}

test("HISTORY_RAW 2020", async () => {
  const fileName = createFileName(20);
  const result = await requestHandlerCall(handler, {
    uri: `${PATHS.HISTORY_RAW}/${fileName}`,
    method: "GET",
    headers: {},
  });
  if (!isCloudFrontResultResponse(result)) {
    expectRequest(result, {
      method: "GET",
      uri: `/${fileName}`,
      origin: false,
      headers: {
        host: false,
      },
    });
  } else {
    throw new Error("Expected a CloudFrontRequest");
  }
});

test("HISTORY_RAW 2023", async () => {
  const fileName = createFileName(23);
  const result = await requestHandlerCall(handler, {
    uri: `${PATHS.HISTORY_RAW}/${fileName}`,
    origin: { s3: { authMethod: "none" } as unknown as CloudFrontS3Origin },
    method: "GET",
    headers: {},
  });
  if (!isCloudFrontResultResponse(result)) {
    expectRequest(result, {
      method: "GET",
      uri: `/${fileName}`,
      origin: true,
      headers: {
        host: "s3domain",
      },
    });
  } else {
    throw new Error("Expected a CloudFrontRequest");
  }
});

test("HISTORY 2020 no querystring", async () => {
  const result = await requestHandlerCall(handler, {
    uri: `${PATHS.HISTORY}`,
    querystring: "",
    method: "GET",
    headers: {},
  });
  if (isCloudFrontResultResponse(result)) {
    expectResponse(result, {
      status: "301",
    });
  } else {
    throw new Error("Expected a CloudFrontResultResponse");
  }
});

test("HISTORY 2020", async () => {
  const fileName = createFileName(20);
  const result = await requestHandlerCall(handler, {
    uri: `${PATHS.HISTORY}/${fileName}`,
    querystring: "api=1&tyyppi=k&piste=2&viikko=12",
    method: "GET",
    headers: {},
  });
  if (!isCloudFrontResultResponse(result)) {
    expectRequest(result, {
      method: "GET",
      origin: true,
      headers: {
        host: "snowflakedomain",
      },
    });
  } else {
    throw new Error("Expected a CloudFrontRequest");
  }
});

test("HISTORY 2020 static", async () => {
  const result = await requestHandlerCall(handler, {
    uri: `${PATHS.HISTORY}/static.gif`,
    querystring: "",
    method: "GET",
    headers: {},
  });
  if (!isCloudFrontResultResponse(result)) {
    expectRequest(result, {
      method: "GET",
      uri: "/static.gif",
    });
  } else {
    throw new Error("Expected a CloudFrontRequest");
  }
});

test("HISTORY 2020 tyyppi missing", async () => {
  await expect(async () => {
    const fileName = createFileName(20);
    await requestHandlerCall(handler, {
      uri: `${PATHS.HISTORY}/${fileName}`,
      querystring: "api=1&piste=2&viikko=12",
      method: "GET",
      headers: {},
    });
  }).rejects.toThrow();
});

test("HISTORY 2020 luokka given, but tyyppi is not h", async () => {
  await expect(async () => {
    const fileName = createFileName(20);
    await requestHandlerCall(handler, {
      uri: `${PATHS.HISTORY}/${fileName}`,
      querystring: "api=1&tyyppi=k&piste=2&viikko=12&luokka=q",
      method: "GET",
      headers: {},
    });
  }).rejects.toThrow();
});
