import axios from "axios";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export interface AreaVisibilityResponse {
    // ISO 8601
    readonly lastUpdated?: string;
    readonly visibilityInMeters: number;
}

export class AreaVisibilityApi {
    private readonly url: string;
    private readonly token: string;

    constructor(url: string, token: string) {
        this.url = url;
        this.token = token;
    }

    async getVisibilityForArea(area: string): Promise<AreaVisibilityResponse> {
        const start = Date.now();
        try {
            const resp = await axios.get(`${this.url}/${area}`, {
                headers: {
                    token: this.token,
                    Accept: MediaType.APPLICATION_JSON
                }
            });
            if (resp.status !== 200) {
                logger.error({
                    method: "AreaVisibilityApi.getVisibilityForArea",
                    message: "failed",
                    status: resp.status
                });
                return Promise.reject();
            }
            return resp.data as AreaVisibilityResponse;
        } catch (error) {
            logger.error({
                method: "AreaVisibilityApi.getVisibilityForArea",
                message: "failed"
            });

            throw new Error("Getting visibility for area failed");
        } finally {
            logger.error({
                method: "AreaVisibilityApi.getVisibilityForArea",
                tookMs: Date.now() - start
            });
        }
    }
}
