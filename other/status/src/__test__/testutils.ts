import type { UpdateStatusSecret } from "../secret.js";
import type { ActiveMaintenance, CStateStatus, PinnedIssue } from "../api/cstate-statuspage-api.js";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { setEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { jest } from "@jest/globals";
import { StatusEnvKeys } from "../keys.js";
import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";

const SERVER_PORT = 8091 as const;
export const C_STATE_PAGE_URL = `http://localhost:${SERVER_PORT}`;
export const NODEPING_API = "https://api.nodeping.com/api/1" as const;
export const CHECK_TIMEOUT_SECONDS = 30 as const;
export const CHECK_INTERVAL_MINUTES = 1 as const;

// 2024-02-20 08:36:51.671186 +0000 UTC
const C_STATE_JSON_DATE_FORMAT = "yyyy-MM-dd HH:mm:ss.SSS xxxx 'Z";

export function setTestEnv(): void {
    setEnvVariable("AWS_REGION", "eu-west-1");
    setEnvVariable(StatusEnvKeys.SECRET_ID, "TEST_SECRET");
    setEnvVariable(StatusEnvKeys.CHECK_TIMEOUT_SECONDS, CHECK_TIMEOUT_SECONDS.toString());
    setEnvVariable(StatusEnvKeys.INTERVAL_MINUTES, CHECK_INTERVAL_MINUTES.toString());
    setEnvVariable(StatusEnvKeys.GITHUB_WORKFLOW_FILE, "update_status_from_nodeping.yml");
    setEnvVariable(StatusEnvKeys.GITHUB_UPDATE_MAINTENANCE_WORKFLOW_FILE, "update_started_maintenance.yml");
    setEnvVariable(StatusEnvKeys.GITHUB_BRANCH, "feature/plaa");
    setEnvVariable(StatusEnvKeys.GITHUB_OWNER, "test");
    setEnvVariable(StatusEnvKeys.GITHUB_REPO, "status-test");
    // /index.json will be added to end
    setEnvVariable(StatusEnvKeys.C_STATE_PAGE_URL, C_STATE_PAGE_URL);
}

export const DEFAULT_SECRET_VALUE = {
    nodePingToken: "nodePingToken",
    nodePingSubAccountId: "nodepingSubAccountId",
    nodePingContactIdSlack1: "Slack1",
    nodePingContactIdSlack2: "Slack2",
    reportUrl: `http://localhost:${SERVER_PORT}/status-report`,
    gitHubPat: "github_pat_plaa"
} satisfies UpdateStatusSecret;

export function mockSecretHolder(
    secretValue: UpdateStatusSecret = DEFAULT_SECRET_VALUE
): SecretHolder<UpdateStatusSecret> {
    jest.spyOn(SecretHolder.prototype, "get").mockReturnValue(Promise.resolve(secretValue));
    return SecretHolder.create<UpdateStatusSecret>();
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
            // cState uses utc iso strings without zone and T in content files
            // and "2024-02-20 08:36:51.671186 +0000 UTC" in jsons
            createdAt: toCStateJsonDateTimeFormat(m.start),
            lastMod: toCStateJsonDateTimeFormat(m.start),
            permalink: `${C_STATE_PAGE_URL}/issues/${
                m.disableNodeping ? "digitraffic-maintenance" : "maintenance"
            }/${m.start.toISOString()}/`,
            affected: ["marine/api/ais/v1/locations", "marine/api/ais/v1/vessels"],
            filename: `maintenance-${m.start.toISOString()}.md`
        } as PinnedIssue;
    });
    const json = {
        is: "index",
        cStateVersion: "5.6",
        apiVersion: "2.0",
        title: "Digitraffic Status",
        languageCodeHTML: "en",
        languageCode: "en",
        baseURL: C_STATE_PAGE_URL,
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
    } as const satisfies CStateStatus;

    console.log(`CState index.json:\n${JSON.stringify(json)}`);
    return json;
}

export function getActiveMaintenance(start: Date = new Date()): ActiveMaintenance {
    const index = getCstateIndexJson([{ disableNodeping: true, start }]);
    return {
        baseURL: index.baseURL,
        issue: index.pinnedIssues[0]!
    };
}

function toISOStringWOZ(date: Date): string {
    return date.toISOString().split("Z")[0]!;
}

// cState uses utc iso strings without zone and T in content files
// and "2024-02-20 08:36:51.671186 +0000 UTC" in jsons
function toCStateJsonDateTimeFormat(date: Date): string {
    return format(new TZDate(date, "UTC"), C_STATE_JSON_DATE_FORMAT);
}

export function emptySecretHolder(): SecretHolder<UpdateStatusSecret> {
    return {} as unknown as SecretHolder<UpdateStatusSecret>;
}
