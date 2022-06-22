import axios from 'axios';

export class PermitsApi {
    readonly apiUrl: string;
    readonly path: string;
    readonly authKey: string;

    readonly genericError: string;

    constructor(apiUrl: string, path: string, authKey: string) {
        this.apiUrl = apiUrl;
        this.path = path;
        this.authKey = authKey;

        this.genericError = `Query to ${this.path} failed`;
    }

    async getPermitsXml(): Promise<string> {
        const start = Date.now();

        try {
            const resp = await axios.get(`${this.apiUrl}${this.path}?authKey=${this.authKey}`, {
                timeout: 10000,
                headers: {
                    'Accept': 'application/xml',
                },
            });
            if (resp.status !== 200) {
                console.error(`method=getPermitsXml query to ${this.path} failed status ${resp.status}`);
                throw Error(`${resp.status} ${resp.statusText}`);
            }
            return resp.data;
        }

        catch (error: unknown) {
            if (error instanceof Error) {
                throw Error(`${this.genericError} with: ${error.message}`);
            }
            throw error;
        }

        finally {
            console.info("method=getPermitsXml tookMs=%d", (Date.now() - start));
        }
    }
}
