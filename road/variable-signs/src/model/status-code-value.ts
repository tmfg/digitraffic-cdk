export interface StatusCodeValue {
  readonly statusCode: number;
}

export const StatusCodeValues = {
  OK: {
    statusCode: 200,
  } as StatusCodeValue,

  INTERNAL_ERROR: {
    statusCode: 500,
  } as StatusCodeValue,

  BAD_REQUEST: {
    statusCode: 400,
  } as StatusCodeValue,
};
