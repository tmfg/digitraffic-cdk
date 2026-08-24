/**
 * Event given to a CloudFront Function (not Lambda@Edge, which wraps everything in `Records[].cf`).
 * Only the fields the functions in this project use are declared.
 */
export interface CloudfrontEvent {
  request: {
    uri: string;
    method: string;
    querystring: ValueObject;
  };

  response: CloudfrontResponse;
}

export interface CloudfrontResponse {
  statusCode: number;

  headers: ValueObject;
}

/** Shape CloudFront uses for headers, query string parameters and cookies. */
interface ValueObject {
  [name: string]: {
    value: string;
    multiValue?: Array<{
      value: string;
    }>;
  };
}
