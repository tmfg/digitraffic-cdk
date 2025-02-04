import { Agent, request } from "undici";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { NemoResponse } from "../model/nemo.js";
import { logException } from "@digitraffic/common/dist/utils/logging";

export class NemoApi {
    readonly _url: string;
    readonly _ca: string;
    readonly _certificate: string;
    readonly _privateKey: string;

    constructor(url: string, ca: string, privateKey: string, certificate: string) {
        this._url = url;
        this._ca = ca;        
        this._certificate = certificate;
        this._privateKey = privateKey;
    }

    async getVisits(from: Date, to: Date): Promise<NemoResponse> {
        const method = "NemoApi.getVisits";
        const url = this.createUrl(from, to);

        try {
            const resp = await request(url, {
                method: "GET",
                dispatcher: new Agent({
                    connect: {
                        ca: this._ca,
                        cert: this._certificate,
                        key: this._privateKey
                    }
                })
            });
    
            if (resp.statusCode !== 200) {
                logger.error({
                    method,
                    customStatus: resp.statusCode,
                });
                
                return Promise.reject();
            }
        } catch (error) {
            logException(logger, error);
    
            return Promise.reject();
        }

        logger.info({
            method,
            message: `Getting visits from ${url}`
        });

        return Promise.resolve([]);
    }

    createUrl(from: Date, to: Date): string {
        return `${this._url}?from=${from.toISOString()}&to=${to.toISOString()}`;
    }
}   