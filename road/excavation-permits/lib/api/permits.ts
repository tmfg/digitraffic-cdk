import axios from 'axios';

export class PermitsApi {
    readonly apiUrl: string;
    readonly path: string;
    readonly authKey: string;

    constructor() {
        this.apiUrl = "https://lahti.infraweb.fi:1880";
        this.path = "/api/v1/kartat/luvat/voimassa";
        this.authKey = process.env.AUTH_KEY as string;
    };

    async getPermitsXml(): Promise<string> {
        const resp = await axios.get(`${this.apiUrl}${this.path}?authKey=${this.authKey}`, {
            headers: {
                'Accept': 'application/xml',
            },
        });
        if (resp.status !== 200) {
            console.error(`method=getXml query to ${this.path} failed status ${resp.status}`);
            throw Error(`Query to ${this.path} failed`);
        }
        return resp.data;
    }
}