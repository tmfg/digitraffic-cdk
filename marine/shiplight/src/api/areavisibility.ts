import ky from "ky";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";

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
            const resp = await ky.get(`${this.url}/${area}`, {
                headers: {
                    token: this.token,
                    Accept: MediaType.APPLICATION_JSON
                }
            });
            if (resp.status !== 200) {
                logger.error({
                    method: "AreaVisibilityApi.getVisibilityForArea",
                    message: "failed",
                    customStatus: resp.status
                });
                return Promise.reject();
            }
            return resp.json<AreaVisibilityResponse>();
        } catch (error) {
            logException(logger, error);

            throw new Error("Getting visibility for area failed");
        } finally {
            logger.info({
                method: "AreaVisibilityApi.getVisibilityForArea",
                tookMs: Date.now() - start
            });
        }
    }
}
