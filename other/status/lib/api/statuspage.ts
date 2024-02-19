import axios, { AxiosError } from "axios";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { logger, LoggerMethodType } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { UpdateStatusSecret } from "../secret";
const STATUSPAGE_API = "https://api.statuspage.io/v1/pages" as const;
const PAGE_SIZE = 100 as const;
const SERVICE = "StatuspageApi" as const;
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";

export enum StatuspageComponentStatus {
    operational = "operational",
    under_maintenance = "under_maintenance",
    degraded_performance = "degraded_performance",
    partial_outage = "partial_outage",
    major_outage = "major_outage"
}

export interface StatuspageComponent {
    readonly name: string;
    readonly id: string;
    // eslint-disable-next-line @rushstack/no-new-null
    readonly group_id: string | null;
    readonly status: StatuspageComponentStatus;
}

export interface StatuspageMaintenance {
    readonly scheduled_for: string;
    readonly scheduled_until: string;
}

export interface StatuspageMaintenances {
    readonly scheduled_maintenances: StatuspageMaintenance[];
}

export class StatuspageApi {
    private readonly secretHolder: SecretHolder<UpdateStatusSecret>;
    private readonly statuspageUrl: string;
    private readonly requestTimeoutMs: number;

    constructor(
        secretHolder: SecretHolder<UpdateStatusSecret>,
        statuspageUrl: string,
        requestTimeoutMs: number
    ) {
        this.secretHolder = secretHolder;
        this.statuspageUrl = statuspageUrl;
        this.requestTimeoutMs = requestTimeoutMs;
    }

    async getStatuspageComponents(): Promise<StatuspageComponent[]> {
        const method = `${SERVICE}.getStatuspageComponents` as const satisfies LoggerMethodType;
        logger.info({
            method,
            message: "Getting StatusPage components"
        });

        let dataLength = 0;
        let page = 1;
        let statuspageComponents: StatuspageComponent[] = [];

        const sh = await this.secretHolder.get();
        do {
            const url = `${STATUSPAGE_API}/${sh.statuspagePageId}/components?per_page=${PAGE_SIZE}&page=${page}`;
            const resp = await axios
                .get<StatuspageComponent[]>(url, {
                    headers: {
                        Authorization: `OAuth ${sh.statuspageApiKey}`
                    }
                })
                .catch((reason: AxiosError) => {
                    throw new Error(
                        `method=${method} Unable to get Statuspage components. Error ${
                            reason.code ? reason.code : ""
                        } ${reason.message}`
                    );
                });

            if (resp.status !== 200) {
                logger.error({
                    method,
                    message: "Getting StatusPage components failed",
                    error: resp
                });
                throw new Error(
                    `method=${method} Unable to get Statuspage components status: HTTP ${resp.status} ${resp.statusText}`
                );
            }

            dataLength = resp.data.length;
            logger.info({
                method,
                message: `Request to ${url} got ${dataLength} components`
            });

            if (dataLength > 0) {
                statuspageComponents = statuspageComponents.concat(resp.data);
            }
            page++;
        } while (dataLength > 0 && page < 20); // page < 20 just to make sure we don't hang here forever in some error situation

        logger.info({
            method,
            message: `Got total of ${statuspageComponents.length} components`
        });

        return statuspageComponents;
    }

    async createStatuspageComponent(endpoint: string, statuspageComponentGroupId: string): Promise<void> {
        const method = `${SERVICE}.getStatuspageComponents` as const satisfies LoggerMethodType;
        logger.info({
            method,
            message: `Creating Statuspage component for endpoint ${endpoint}`
        });
        const sh = await this.secretHolder.get();
        const resp = await axios
            .post(
                `${STATUSPAGE_API}/${sh.statuspagePageId}/components`,
                {
                    component: {
                        description: endpoint,
                        status: "operational",
                        name: endpoint,
                        only_show_if_degraded: "false",
                        group_id: statuspageComponentGroupId,
                        showcase: "true"
                    }
                },
                {
                    headers: {
                        Authorization: `OAuth ${sh.statuspageApiKey}`,
                        "Content-type": MediaType.APPLICATION_JSON
                    }
                }
            )
            .catch((reason: AxiosError) => {
                throw new Error(
                    `method=createStatuspageComponent Unable to create Statuspage component for endpoint ${endpoint}. ` +
                        `Error ${reason.code ? reason.code : ""} ${reason.message}`
                );
            });

        if (resp.status !== 201) {
            throw new Error(
                `method=createStatuspageComponent Unable to Statuspage component for endpoint ${endpoint}. ` +
                    `HTTP ${resp.status} ${resp.statusText}`
            );
        }

        logger.info({
            method,
            message: `Creating component for endpoint ${endpoint} done`
        });
    }

    async getActiveStatusPageMaintenances(): Promise<StatuspageMaintenances> {
        const message = "Get active StatusPage maintenances";
        const method = `${SERVICE}.getActiveStatusPageMaintenances` as const satisfies LoggerMethodType;
        const start = Date.now();

        return axios
            .get<StatuspageMaintenances>(`${this.statuspageUrl}/api/v2/scheduled-maintenances/active.json`, {
                timeout: this.requestTimeoutMs,
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
            .then((response) => response.data)
            .finally(() =>
                logger.info({
                    method: method,
                    message: `${message} done`,
                    tookMs: Date.now() - start
                })
            );
    }
}
