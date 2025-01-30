import { jest } from "@jest/globals";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";

jest.spyOn(SecretHolder.prototype, "get").mockImplementation(() =>
  Promise.resolve({
    s3DomainTmsRawOngoing: "s3domain",
    snowflakeDomain: "snowflakedomain",
  })
);

import { handler, PATHS } from "../../lambda/lambda-lam-redirect.js";
import { expectRequest, requestHandlerCall } from "./request-util.js";
import { type CloudFrontS3Origin } from "aws-lambda";
import { expectResponse } from "./response-util.js";

function createFileName(year: number): string {
  return `lamraw_1234_${year}_1.csv`;
}

test("HISTORY_RAW 2020", async () => {
  const fileName = createFileName(20);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const cb = await requestHandlerCall(handler, {
    uri: `${PATHS.HISTORY_RAW}/${fileName}`,
    method: "GET",
    headers: {},
  });

  expectRequest(cb, {
    method: "GET",
    uri: `/${fileName}`,
    origin: false,
    headers: {
      "host": false,
    },
  });
});

test("HISTORY_RAW 2023", async () => {
  const fileName = createFileName(23);
  const cb = await requestHandlerCall(handler, {
    uri: `${PATHS.HISTORY_RAW}/${fileName}`,
    origin: { s3: { authMethod: "none" } as unknown as CloudFrontS3Origin },
    method: "GET",
    headers: {},
  });

  expectRequest(cb, {
    method: "GET",
    uri: `/${fileName}`,
    origin: true,
    headers: {
      "host": "s3domain",
    },
  });
});

test("HISTORY 2020 no querystring", async () => {
  const cb = await requestHandlerCall(handler, {
    uri: `${PATHS.HISTORY}`,
    querystring: "",
    method: "GET",
    headers: {},
  });

  expectResponse(cb, {
    status: "301",
  });
});

test("HISTORY 2020", async () => {
  const fileName = createFileName(20);
  const cb = await requestHandlerCall(handler, {
    uri: `${PATHS.HISTORY}/${fileName}`,
    querystring: "api=1&tyyppi=k&piste=2&viikko=12",
    method: "GET",
    headers: {},
  });

  expectRequest(cb, {
    method: "GET",
    origin: true,
    headers: {
      "host": "snowflakedomain",
    },
  });
});

test("HISTORY 2020 static", async () => {
  const cb = await requestHandlerCall(handler, {
    uri: `${PATHS.HISTORY}/static.gif`,
    querystring: "",
    method: "GET",
    headers: {},
  });

  expectRequest(cb, {
    method: "GET",
    uri: "/static.gif",
  });
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
