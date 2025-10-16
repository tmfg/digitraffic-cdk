import type { ResponsePromise } from "ky";

export function mockKyResponse(status: number, body: string): ResponsePromise {
  const response = new Response(body, {
    status: status,
  });

  const promise = Promise.resolve(response);

  // The ky ResponsePromise is just Promise<Response> with some convenience methods.
  return Object.assign(promise as ResponsePromise, {
    arrayBuffer: () => response.arrayBuffer(),
    blob: () => response.blob(),
    // eslint-disable-next-line deprecation/deprecation
    formData: () => response.formData(),
    json: () => response.json(),
    text: () => response.text(),
  });
}
