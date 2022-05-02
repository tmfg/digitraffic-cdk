import axios from "axios";
import {MediaType} from "digitraffic-common/aws/types/mediatypes";

export class VtsApi {

    private readonly url: string

    constructor(url: string) {
        this.url = url;
    }

    async sendVoyagePlan(voyagePlan: string) {
        const start = Date.now();
        const resp = await axios.post(this.url, voyagePlan, {
            headers: {
                'Content-Type': MediaType.APPLICATION_XML,
            },
        });
        if (resp.status !== 200) {
            console.error(`method=uploadArea returned status=${resp.status}, status text: ${resp.statusText}`);
            throw new Error('Failed to send voyage plan to VTS');
        }
        console.info(`method=sendVoyagePlan tookMs=${Date.now()-start}`);
    }

}
