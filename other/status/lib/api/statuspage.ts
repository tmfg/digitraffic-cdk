import axios from "axios";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";

const STATUSPAGE_API = "https://api.statuspage.io/v1/pages";

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
        console.log("Fetching Statuspage components");
        const resp = await axios.get<StatuspageComponent[]>(
            `${STATUSPAGE_API}/${this.statuspagePageId}/components`,
            {
                headers: {
                    Authorization: `OAuth ${this.statuspageApiKey}`,
                },
            }
        );
        if (resp.status !== 200) {
            throw new Error("Unable to get Statuspage components");
        }
        console.log("..done");
        return resp.data;
    }

    async createStatuspageComponent(
        endpoint: string,
        statuspageComponentGroupId: string
    ) {
        console.log("Creating Statuspage component for endpoint", endpoint);
        const resp = await axios.post(
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
        );
        if (resp.status !== 201) {
            throw new Error("Unable to create Statuspage component");
        }
        console.log("..done");
    }
}
