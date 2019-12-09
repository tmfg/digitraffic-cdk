import * as http from 'http';

export class TestHttpServer {

    private server: http.Server;
    private debug: boolean;

    listen(props: ListenProperties, debug: boolean = false) {
        this.debug = debug;
        this.debuglog('Starting test server');
        this.server = http.createServer(((req, res) => {
            this.debuglog('Received request to url ' + req.url + '..');
            if (req.url && req.url in props) {
                this.debuglog('..url matched');
                res.writeHead(200);
                res.end(props[req.url]());
            } else {
                this.debuglog('..no match');
            }
        }));
        this.server.listen(8089);
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
