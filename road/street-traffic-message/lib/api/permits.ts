import axios from 'axios';

export class PermitsApi {
    readonly apiUrl: string;
    readonly path: string;
    readonly authKey: string;

    constructor(apiUrl: string, path: string, authKey: string) {
        this.apiUrl = apiUrl;
        this.path = path;
        this.authKey = authKey;
    }

    async getPermitsXml(): Promise<string> {
        const start = Date.now();

        try {
            const resp = await axios.get(`${this.apiUrl}${this.path}?authKey=${this.authKey}`, {
                headers: {
                    'Accept': 'application/xml',
                },
            });
            if (resp.status !== 200) {
                console.error(`method=getPermitsXml query to ${this.path} failed status ${resp.status}`);
                throw Error(`Query to ${this.path} failed`);
            }
            return resp.data;
        } finally {
            console.info("method=getPermitsXml tookMs=%d", (Date.now() - start));
        }
    }
}