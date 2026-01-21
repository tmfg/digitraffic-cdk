import type { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";

export class ExpectResponse {
  private _response: LambdaResponse;

  constructor(response: LambdaResponse) {
    this._response = response;
  }

  static ok(response: LambdaResponse): ExpectResponse {
    return new ExpectResponse(response)
      .expectStatus(200);
  }

  static notFound(
    response: LambdaResponse,
    body: string = "Not Found",
  ): ExpectResponse {
    return new ExpectResponse(response)
      .expectStatus(404)
      .expectBody(body);
  }

  static badRequest(response: LambdaResponse): ExpectResponse {
    return new ExpectResponse(response)
      .expectStatus(400);
  }

  static internalError(response: LambdaResponse): ExpectResponse {
    return new ExpectResponse(response)
      .expectStatus(500);
  }

  expectStatus(expected: number): this {
    expect(this._response.status).toEqual(expected);

    return this;
  }

  expectBody(expected: string): this {
    const body = Buffer.from(this._response.body, "base64").toString();

    expect(body).toEqual(expected);

    return this;
  }

  expectJson<T>(expected: T): this {
    return this.expectContent((content: T) => {
      expect(content).toEqual(expected);
    });
  }

  expectContent<T>(checker: (t: T) => void): this {
    const body = Buffer.from(this._response.body, "base64").toString();
    const content: T = JSON.parse(body) as T;

    checker(content);

    return this;
  }
}
