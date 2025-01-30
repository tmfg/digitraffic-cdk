export interface CloudfrontEvent {
  request: {
    uri: string;
  };
}

export interface CloudfrontResponse {
  statusCode: number;
  headers: {
    location: {
      value: string;
    };
  };
}

/*
Adds '/' to the end of path if it is missing when navigating to /history page.
Apparantely the Angular app doesn't function well if it is missing.
 */
// @ts-ignore
export function handler(
  event: CloudfrontEvent,
): CloudfrontEvent["request"] | CloudfrontResponse {
  // eslint-disable-next-line
  var request = event.request;
  // eslint-disable-next-line
  var uri = request.uri;

  if (uri.match(/^\/history$/)) {
    return {
      statusCode: 301,
      headers: {
        location: {
          value: `${uri}/`,
        },
      },
    };
  }

  return request;
}
