import * as http from 'http';

export class TestHttpServer {
    private server: http.Server;
    private debug: boolean;

    listen(port: number, props: ListenProperties, debug: boolean = false) {
        this.debug = debug;
        this.debuglog('Starting test server');
        this.server = http.createServer(((req, res) => {
            this.debuglog('Received request to url ' + req.url + '..');
            const path = require('url').parse(req.url).pathname;

            if (path in props) {
                this.debuglog('..url matched');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Headers', 'X-User-Id,X-Auth-Token');
                res.writeHead(200);
                res.end(props[path]());
            } else {
                this.debuglog('..no match');
            }
        }));
        this.server.listen(port);
    }

    close() {
        this.debuglog('Closing test server');
        this.server.close();
    }

    private debuglog(str: string) {
        if (this.debug) {
            console.debug(str);
        }
    }
}

interface ListenProperties {
    [key:string]: () => string;
}
