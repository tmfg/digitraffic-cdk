export interface CloudfrontEvent {
  request: {
    uri: string;
    method: string;
  };

  response: CloudfrontResponse;
}

export interface CloudfrontResponse {
  statusCode: number;

  headers: HeadersObject;
}

interface HeadersObject {
  [name: string]: {
    value: string;
    multiValue?: Array<{
      value: string;
    }>;
  };
}
