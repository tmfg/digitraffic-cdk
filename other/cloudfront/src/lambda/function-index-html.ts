interface CloudfrontEvent {
  request: {
    uri: string;
  };
}

/*
    This is a edge function that should be run at cloudfront at viewer request event.
    It adds index.html to request end if missing.

    You must replace EXT_VERSION with timestamp to change code when deploying.  You can't deploy a new lambda version
    if the code does not change.
 */
// @ts-ignore
export function handler(event: CloudfrontEvent): CloudfrontEvent["request"] {
  // eslint-disable-next-line
  var request = event.request;
  // eslint-disable-next-line
  var uri = request.uri;

  if (uri.endsWith("/")) {
    request.uri += "index.html";
  }

  return request;
}
