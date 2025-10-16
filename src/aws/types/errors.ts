// DEPRECATED, remove these!
export const NOT_FOUND_MESSAGE = "NOT_FOUND";
export const ERROR_MESSAGE = "ERROR";
export const OK_MESSAGE = "OK";
export const BAD_REQUEST_MESSAGE = "BAD REQUEST";

export class ValidationError extends Error {
  statusCode: number;

  constructor(statusCode: number, body: string) {
    super(body);
    this.statusCode = statusCode;
  }
}
