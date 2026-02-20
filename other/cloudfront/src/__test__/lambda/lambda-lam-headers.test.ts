import { HEADERS, handler } from "../../lambda/lambda-lam-headers.js";
import { createHeader } from "./request-util.js";
import { expectResponse, responseHandlerCall } from "./response-util.js";

test("filename header gets added with pvm", async () => {
  const cb = await responseHandlerCall(
    handler,
    {
      uri: "/testi",
      method: "GET",
      querystring: "tyyppi=h&pvm=2023-03-01&loppu=&lam_type=option1&piste=1",
    },
    {
      headers: createHeader(HEADERS.REMAPPED_HOST, "value"),
    },
  );

  expectResponse(cb, {
    headers: {
      [HEADERS.CONTENT_DISPOSITION]:
        'attachment; filename="testi_h_2023-03-01.csv"',
      [HEADERS.CONTENT_TYPE]: "text/csv; charset=utf-8",
    },
  });
});

test("filename header gets added with week", async () => {
  const cb = await responseHandlerCall(
    handler,
    {
      uri: "/testi",
      method: "GET",
      querystring: "tyyppi=h&viikko=12&loppu=&lam_type=option1&piste=1",
    },
    {
      headers: createHeader(HEADERS.REMAPPED_HOST, "value"),
    },
  );

  expectResponse(cb, {
    headers: {
      [HEADERS.CONTENT_DISPOSITION]: 'attachment; filename="testi_h_12.csv"',
      [HEADERS.CONTENT_TYPE]: "text/csv; charset=utf-8",
    },
  });
});

test("malformed querystring", async () => {
  await expect(async () => {
    await responseHandlerCall(
      handler,
      {
        uri: "/testi",
        method: "GET",
        querystring: "tyyppi=h&loppu=&lam_type=option1&piste=1",
      },
      {
        headers: createHeader(HEADERS.REMAPPED_HOST, "value"),
      },
    );
  }).rejects.toThrow();
});

test("no filename header gets added", async () => {
  const cb = await responseHandlerCall(
    handler,
    {
      uri: "testi",
      method: "GET",
    },
    {
      headers: {},
    },
  );

  expectResponse(cb, {
    headers: {
      [HEADERS.CONTENT_DISPOSITION]: false,
      [HEADERS.CONTENT_TYPE]: false,
    },
  });
});

test("snowflake headers get deleted", async () => {
  const cb = await responseHandlerCall(
    handler,
    {
      uri: "testi",
      method: "GET",
    },
    {
      headers: createHeader(HEADERS.X_API_KEY, "value"),
    },
  );

  expectResponse(cb, {
    headers: {
      [HEADERS.X_API_KEY]: false,
    },
  });
});
