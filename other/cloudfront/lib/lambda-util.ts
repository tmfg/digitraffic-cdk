interface Response {
    headers: Record<
        string,
        | {
              key: string;
              value: string;
          }[]
        | undefined
    >;
}

export function addCorsHeaders(response: Response): void {
    const responseHeaders = response.headers;
    responseHeaders["access-control-allow-methods"] = [
        {
            key: "access-control-allow-methods",
            value: "GET, POST, OPTIONS"
        }
    ];
    responseHeaders["access-control-allow-headers"] = [
        {
            key: "access-control-allow-headers",
            value: "DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range,Digitraffic-User"
        }
    ];
    responseHeaders["access-control-expose-headers"] = [
        {
            key: "access-control-expose-headers",
            value: "DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range,Digitraffic-User"
        }
    ];
}

const xAmzLastModifiedHeader = "x-amz-meta-last-modified";
const xAmzLastModifiedHeaderUpper = "X-Amz-Meta-Last-Modified";
const lastModifiedHeader = "last-modified";

export function addWeathercamImageLastModifiedHeaderFromXAmzMeta(response: Response): void {
    const responseHeaders = response.headers;
    if (responseHeaders[xAmzLastModifiedHeader]) {
        responseHeaders[lastModifiedHeader] = [
            {
                key: lastModifiedHeader,
                value: responseHeaders[xAmzLastModifiedHeader][0].value
            }
        ];
    } else if (responseHeaders[xAmzLastModifiedHeaderUpper]) {
        responseHeaders[lastModifiedHeader] = [
            {
                key: lastModifiedHeader,
                value: responseHeaders[xAmzLastModifiedHeaderUpper][0].value
            }
        ];
    }
}
