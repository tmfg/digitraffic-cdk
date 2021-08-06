export function addCorsHeaders(response: any) {
    const responseHeaders = response.headers;
    responseHeaders['access-control-allow-methods'] = [{
        key: 'access-control-allow-methods',
        value: 'GET, POST, OPTIONS'
    }];
    responseHeaders['access-control-allow-headers'] = [{
        key: 'access-control-allow-headers',
        value: 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range,Digitraffic-User'
    }];
    responseHeaders['access-control-expose-headers'] = [{
        key: 'access-control-expose-headers',
        value: 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range,Digitraffic-User'
    }];
}
