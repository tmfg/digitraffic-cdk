import { mockSecret, stubSecretsManager } from "@digitraffic/common/dist/test/secrets-manager";
import { UpdateStatusSecret } from "../lib/secret";
import { CStateStatus, PinnedIssue } from "../lib/api/cstate-statuspage-api";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";

export const SERVER_PORT = 8091;
export const HOST_URL = `http://localhost:${SERVER_PORT}`;
export const STATUSPAGE_PATH = `/statuspage-status`;
export const C_STATE_PATH = `/cstate-status`;
export const C_STATE_PAGE_URL = `${HOST_URL}${C_STATE_PATH}`;
export const STATUSPAGE_URL = `${HOST_URL}${STATUSPAGE_PATH}`;
export const CHECK_TIMEOUT_SECONDS = 30;
export const CHECK_INTERVAL_MINUTES = 1;

export function setTestEnv(): void {
    process.env.SECRET_ID = "TEST_SECRET";
    process.env.CHECK_TIMEOUT_SECONDS = CHECK_TIMEOUT_SECONDS.toString();
    process.env.INTERVAL_MINUTES = CHECK_INTERVAL_MINUTES.toString();
    process.env.GITHUB_WORKFLOW_FILE = "update_status_from_nodeping.yml";
    process.env.GITHUB_BRANCH = "feature/plaa";
    process.env.GITHUB_OWNER = "test";
    process.env.GITHUB_REPO = "status-test";
    process.env.STATUSPAGE_URL = STATUSPAGE_URL;
    // /index.json will be added to end
    process.env.C_STATE_PAGE_URL = C_STATE_PAGE_URL;
}

export const DEFAULT_SECRET_VALUE = {
    nodePingToken: "nodePingToken",
    nodePingSubAccountId: "nodepingSubAccountId",
    statuspagePageId: "statuspagePageId",
    statuspageApiKey: "statuspageApiKey",
    statusPageRoadComponentGroupId: "statusPageRoadComponentGroupId",
    statusPageMarineComponentGroupId: "statusPageMarineComponentGroupId",
    statusPageRailComponentGroupId: "statusPageRailComponentGroupId",
    nodePingContactIdSlack1: "Slack1",
    nodePingContactIdSlack2: "Slack2",
    reportUrl: `http://localhost:${SERVER_PORT}`,
    gitHubPat: "github_pat_plaa"
} as UpdateStatusSecret;

export function mockSecretManager(secretValue: UpdateStatusSecret = DEFAULT_SECRET_VALUE): void {
    stubSecretsManager();
    mockSecret(secretValue);
}

export function getCstateIndexJson(
    maintenances: {
        readonly disableNodeping: boolean;
        readonly start: Date;
    }[] = []
): CStateStatus {
    const pinnedIssues: PinnedIssue[] = maintenances.map((m) => {
        return {
            is: "issue",
            title: `Weekly service break ${toISOStringWOZ(m.start)} 10:00 – 14:00`,
            // cState uses utc iso strings without zone and T between date and time
            createdAt: toISOStringWOZ(m.start),
            lastMod: toISOStringWOZ(m.start),
            permalink: `${C_STATE_PAGE_URL}/issues/maintenance${
                m.disableNodeping ? "-disable-nodeping" : ""
            }/maintenance-${m.start.toISOString()}/`,
            affected: ["marine/api/ais/v1/locations", "marine/api/ais/v1/vessels"],
            filename: `maintenance-${m.start.toISOString()}.md`
        } as PinnedIssue;
    });
    return {
        is: "index",
        cStateVersion: "5.6",
        apiVersion: "2.0",
        title: "Digitraffic Status",
        languageCodeHTML: "en",
        languageCode: "en",
        baseURL: `https://localhost:${SERVER_PORT}`,
        description:
            "We continuously monitor the status of our services and if there are any interruptions, a note will be posted here.",
        summaryStatus: "ok",
        categories: [
            {
                name: "Marine",
                hideTitle: false,
                closedByDefault: true
            }
        ],
        pinnedIssues,
        // [
        //     {
        //         is: "issue",
        //         title: "Weekly service 2024-02-28 break 10:00 – 14:00",
        //         createdAt: "2024-02-28 10:10:00.9 +0000 UTC",
        //         lastMod: "2024-02-28 10:10:00.9 +0000 UTC",
        //         permalink: "//localhost:1313/issues/maintenance-disable-nodeping/maintenance-weekly/",
        //         affected: ["marine/api/ais/v1/locations", "marine/api/ais/v1/vessels"],
        //         filename: "maintenance-weekly.md"
        //     }
        // ],
        systems: [
            {
                name: "marine/api/ais/v1/locations",
                description:
                    "Find latest vessel locations by mmsi and optional timestamp interval in milliseconds from Unix epoch.",
                category: "Marine",
                status: "ok",
                unresolvedIssues: []
            },
            {
                name: "marine/api/ais/v1/vessels",
                description: "Return latest vessel metadata for all known vessels.",
                category: "Marine",
                status: "ok",
                unresolvedIssues: []
            }
        ],
        tabs: [],
        buildDate: "2024-01-26",
        buildTime: "12:12",
        buildTimezone: "CET",
        colorBrand: "#0a0c0f",
        colorOk: "#008000",
        colorDisrupted: "#cc4400",
        colorDown: "#e60000",
        colorNotice: "#24478f",
        alwaysKeepBrandColor: "true",
        logo: "//localhost:1313/img/Fintraffic_vaakalogo_valkoinen.svg",
        googleAnalytics: "UA-00000000-1"
    };
}

function toISOStringWOZ(date: Date): string {
    return date.toISOString().split("Z")[0];
}

export function emptySecretHolder(): SecretHolder<UpdateStatusSecret> {
    return {} as unknown as SecretHolder<UpdateStatusSecret>;
}
