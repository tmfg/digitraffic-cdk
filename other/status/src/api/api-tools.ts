import { HTTPError } from "ky";

export type ErrorOrHTTPError = Error | HTTPError;

export async function convertToError(error: ErrorOrHTTPError): Promise<Error> {
  if (error instanceof HTTPError) {
    return new Error(
      `{ "name": "${error.name}", "message: "${error.message}", "status": "${
        error.response.status ?? "-"
      }", "url": "${error.request.url ?? "-"}", "method": "${
        error.request.method ?? "-"
      }", "response": "${
        error.response ? await error.response.text() : "-"
      }" }`,
    );
  } else {
    return error;
  }
}
