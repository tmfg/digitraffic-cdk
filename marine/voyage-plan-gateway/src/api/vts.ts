import axios from "axios";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export class VtsApi {
    private readonly url: string;

    constructor(url: string) {
        this.url = url;
    }

    async sendVoyagePlan(voyagePlan: string): Promise<void> {
        const start = Date.now();
        const resp = await axios.post(this.url, voyagePlan, {
            headers: {
                "Content-Type": MediaType.APPLICATION_XML
            }
        });
        if (resp.status !== 200) {
            logger.error({
                method: "VtsApi.uploadArea",
                customStatus: resp.status,
                message: "status text: " + resp.statusText
            });

            throw new Error("Failed to send voyage plan to VTS");
        }

        logger.info({
            method: "VtsApi.sendVoyagePlan",
            tookMs: Date.now() - start
        });
    }
}
