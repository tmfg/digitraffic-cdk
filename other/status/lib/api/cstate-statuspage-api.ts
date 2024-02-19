import axios, { AxiosError } from "axios";
import { logger, LoggerMethodType } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const STATUS_JSON_PATH = "/index.json" as const;

const SERVICE = "CStateStatuspageApi" as const;
const MINUTE_MS = 60000 as const;

export enum StatuspageComponentStatus {
    operational = "operational",
    under_maintenance = "under_maintenance",
    degraded_performance = "degraded_performance",
    partial_outage = "partial_outage",
    major_outage = "major_outage"
}

export interface CStateSystem extends Record<string, unknown> {
    readonly name: string; // "marine/api/ais/v1/locations",
    readonly description: string; // "Find latest vessel locations by mmsi and optional timestamp interval in milliseconds from Unix epoch.",
    readonly category: "Road" | "Marine" | "Rail";
    readonly status: "ok" | "notice" | "disrupted" | "down";
}

export interface CStateStatus extends Record<string, unknown> {
    readonly pinnedIssues: PinnedIssue[];
    readonly systems: CStateSystem[];
}

export interface PinnedIssue {
    readonly is: string;
    readonly title: string;
    readonly createdAt: string;
    readonly lastMod: string;
    readonly permalink: string;
    readonly affected: string[];
    readonly filename: string;
}

export class CStateStatuspageApi {
    private readonly cStatePageUrl: string;

    constructor(cStatePageUrl: string) {
        this.cStatePageUrl = cStatePageUrl;
    }

    async getStatus(): Promise<CStateStatus> {
        const method = `${SERVICE}.getStatus` as const satisfies LoggerMethodType;
        const start = Date.now();
        logger.info({
            method,
            message: "Getting cState status"
        });

        const statusJsonUrl = `${this.cStatePageUrl}${STATUS_JSON_PATH}`;
        return await axios
            .get<CStateStatus>(statusJsonUrl, {
                validateStatus: (status: number) => {
                    return status === 200;
                }
            })
            .catch((reason: AxiosError) => {
                throw new Error(
                    `method=${method} Unable to get cState status from ${statusJsonUrl}. Error ${
                        reason.code ? reason.code : ""
                    } ${reason.message}`
                );
            })
            .then((response) => {
                return response.data;
            })
            .finally(() =>
                logger.info({
                    method,
                    message: "Getting cState status done",
                    tookMs: Date.now() - start
                })
            );
    }

    async isActiveMaintenances(): Promise<boolean> {
        const status = await this.getStatus();
        return this.hasStatusActiveMaintenances(status);
    }

    private hasStatusActiveMaintenances(cStatus: CStateStatus): boolean {
        const method = `${SERVICE}.hasStatusActiveMaintenances` as const satisfies LoggerMethodType;
        // This is executed ever minute, so in worst case it will turn off one minute late.
        // Make it turn on max one minute too early :)
        const now = Date.now() + MINUTE_MS;

        for (const issue of cStatus.pinnedIssues) {
            // Dates should be in Z time without Z.
            // Append Z if date-time is missing zone info
            const starts = Date.parse(
                issue.createdAt.includes("Z") ||
                    issue.createdAt.includes("UTC") ||
                    issue.createdAt.includes("+")
                    ? issue.createdAt
                    : issue.createdAt + "Z"
            );
            if (starts <= now && issue.permalink.includes("/maintenance-disable-nodeping/")) {
                logger.info({
                    method,
                    message: `Active maintenance found: ${issue.title} ${issue.permalink}`
                });
                return true;
            }
        }

        logger.info({
            method,
            message: "No active maintenance found"
        });
        return false;
    }
}
