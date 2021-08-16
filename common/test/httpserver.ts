import * as http from 'http';

/**
 * A mock HTTP server created for testing connections from a Lambda to an outside integration
 */
export class TestHttpServer {
    private server: http.Server;
    private debug: boolean;

    private messageStack: string[];

    getCallCount(): number {
        return this.messageStack.length;
    }

    getRequestBody(callNumber: number): string {
        return this.messageStack[callNumber];
    }

    listen(port: number, props: ListenProperties, debug: boolean = false, statusCode = 200) {
        this.debug = debug;
        this.messageStack = [];
        this.debuglog(`Starting test server on port ${port}`);
        this.server = http.createServer(((req, res) => {
            this.debuglog('Mapped urls: ');

            Object.keys(props).forEach(k => this.debuglog(k));
            this.debuglog('Received request to url ' + req.url + '..');
            const path = require('url').parse(req.url).pathname;

            if (path in props) {
                this.debuglog('..url matched');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Headers', 'Authorization,X-User-Id,X-Auth-Token');
                res.writeHead(statusCode);

                let dataStr = '';
                req.on('data', chunk => {
                    if (chunk) {
                        dataStr += chunk;
                    }
                })

                req.on('end', () => {
                    // assume sent data is in JSON format
                    this.messageStack[this.messageStack.length] = dataStr;
                    res.end(props[path](req.url, dataStr));
                });
            } else {
                this.messageStack[this.messageStack.length] = "NO MATCH";
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
    [key:string]: (url?: string, data?: string) => string;
}
