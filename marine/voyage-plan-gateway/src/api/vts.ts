import ky from "ky";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export class VtsApi {
    private readonly url: string;

    constructor(url: string) {
        this.url = url;
    }

    async sendVoyagePlan(voyagePlan: string): Promise<void> {
        const start = Date.now();
        const response = await ky.post(this.url, {
            headers: {
                "Content-Type": MediaType.APPLICATION_XML
            },
            body: voyagePlan
        });
        if (!response.ok) {
            logger.error({
                method: "VtsApi.uploadArea",
                customStatus: response.status,
                message: "status text: " + response.statusText
            });

            throw new Error("Failed to send voyage plan to VTS");
        }

        logger.info({
            method: "VtsApi.sendVoyagePlan",
            tookMs: Date.now() - start
        });
    }
}
