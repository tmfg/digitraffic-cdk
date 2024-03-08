import type { MonitoredApp } from "../app-props.js";
import axios from "axios";
import type { AppWithEndpoints } from "../model/app-with-endpoints.js";
import { logger, type LoggerMethodType } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import _ from "lodash";

const BETA = "/beta/" as const;

interface EndpointResponse {
    readonly paths: string[];
}

/**
 * Get endpoints form OpenApi spesification (OpenAPI Specification)
 */
export class DigitrafficApi {
    async getAppWithEndpoints(app: MonitoredApp): Promise<AppWithEndpoints> {
        const method = "DigitrafficApi.getAppEndpoints" as const satisfies LoggerMethodType;
        const start = Date.now();
        const message = `Fetch digitraffic endpoints for ${app.name} from ${app.url}` as const;
        logger.info({
            method,
            message
        });
        // Swagger url
        return axios
            .get<EndpointResponse>(app.url, {
                headers: {
                    "accept-encoding": "gzip"
                },
                validateStatus: (status: number) => {
                    return status === 200;
                }
            })
            .catch((reason) => {
                const errorMessage = `${message} failed with reason: ${JSON.stringify(reason)}`;
                logger.error({
                    method,
                    message: errorMessage
                });
                throw new Error(`${method} ${message}`);
            })
            .then((resp) => {
                return this.createAppWithEndpointsResponse(app, resp.data);
            })
            .finally(() =>
                logger.info({
                    method: method,
                    message: `${message} done`,
                    tookMs: Date.now() - start
                })
            );
    }

    private createAppWithEndpointsResponse(app: MonitoredApp, resp: EndpointResponse): AppWithEndpoints {
        const method = "DigitrafficApi.createEndpointResponse" as const satisfies LoggerMethodType;

        const all = _.keys(resp.paths).filter(
            // Filter all api paths that needs path-parameter
            (p) => !p.includes("{")
        );
        const notBeta = all.filter((e) => !e.includes(BETA));
        const beta = all.filter((e) => e.includes(BETA));
        notBeta.sort();
        beta.sort();

        logger.info({
            method,
            message: `Found ${all.length}/${
                _.keys(resp.paths).length
            } Digitraffic endpoints without path parameters for ${app.name}`
        });

        return {
            app: app.name,
            hostPart: app.hostPart,
            endpoints: ([] as string[])
                .concat(notBeta)
                .concat(beta)
                .filter((e) => !app.excluded.includes(e)),
            extraEndpoints: app.endpoints
        } as const satisfies AppWithEndpoints;
    }
}
