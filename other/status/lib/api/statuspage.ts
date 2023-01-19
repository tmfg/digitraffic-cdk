import axios, { AxiosError } from "axios";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";

const STATUSPAGE_API = "https://api.statuspage.io/v1/pages";
const PAGE_SIZE = 100;

export enum StatuspageComponentStatus {
    operational = "operational",
    under_maintenance = "under_maintenance",
    degraded_performance = "degraded_performance",
    partial_outage = "partial_outage",
    major_outage = "major_outage",
}

export interface StatuspageComponent {
    readonly name: string;
    readonly id: string;
    readonly group_id: string;
    readonly status: StatuspageComponentStatus;
}

export class StatuspageApi {
    private readonly statuspagePageId: string;
    private readonly statuspageApiKey: string;

    constructor(statuspagePageId: string, statuspageApiKey: string) {
        this.statuspagePageId = statuspagePageId;
        this.statuspageApiKey = statuspageApiKey;
    }

    async getStatuspageComponents(): Promise<StatuspageComponent[]> {
        console.log(`method=getStatuspageComponents`);

        let dataLength = 0;
        let page = 1;
        let statuspageComponents: StatuspageComponent[] = [];

        do {
            const url = `${STATUSPAGE_API}/${this.statuspagePageId}/components?per_page=${PAGE_SIZE}&page=${page}`;
            const resp = await axios
                .get<StatuspageComponent[]>(url, {
                    headers: {
                        Authorization: `OAuth ${this.statuspageApiKey}`,
                    },
                })
                .catch((reason: AxiosError) => {
                    throw new Error(
                        `method=getStatuspageComponents Unable to get Statuspage components. Error ${
                            reason.code ? reason.code : ""
                        } ${reason.message}`
                    );
                });

            if (resp.status !== 200) {
                throw new Error(
                    `method=getStatuspageComponents Unable to get Statuspage components status: HTTP ${resp.status} ${resp.statusText}`
                );
            }

            dataLength = resp.data.length;
            console.log(
                `method=getStatuspageComponents ${url} got ${dataLength} components`
            );
            if (dataLength > 0) {
                statuspageComponents = statuspageComponents.concat(resp.data);
            }
            page++;
        } while (dataLength > 0);

        console.log(
            `method=getStatuspageComponents got ${statuspageComponents.length} components`
        );
        return statuspageComponents;
    }

    async createStatuspageComponent(
        endpoint: string,
        statuspageComponentGroupId: string
    ) {
        console.log(
            "method=createStatuspageComponent Creating Statuspage component for endpoint",
            endpoint
        );
        const resp = await axios
            .post(
                `${STATUSPAGE_API}/${this.statuspagePageId}/components`,
                {
                    component: {
                        description: endpoint,
                        status: "operational",
                        name: endpoint,
                        only_show_if_degraded: "false",
                        group_id: statuspageComponentGroupId,
                        showcase: "true",
                    },
                },
                {
                    headers: {
                        Authorization: `OAuth ${this.statuspageApiKey}`,
                        "Content-type": MediaType.APPLICATION_JSON,
                    },
                }
            )
            .catch((reason: AxiosError) => {
                throw new Error(
                    `method=createStatuspageComponent Unable to create Statuspage component for endpoint ${endpoint}. ` +
                        `Error ${reason.code ? reason.code : ""} ${
                            reason.message
                        }`
                );
            });

        if (resp.status !== 201) {
            throw new Error(
                `method=createStatuspageComponent Unable to Statuspage component for endpoint ${endpoint}. ` +
                    `HTTP ${resp.status} ${resp.statusText}`
            );
        }

        console.log(
            `method=createStatuspageComponent for endpoint ${endpoint} done`
        );
    }
}
