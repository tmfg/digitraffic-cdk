import { Query, Sort } from "./queries";
import { OSTrigger } from "./triggers";

interface OSQueryData {
    readonly size?: number;
    readonly sort?: Sort[];
    readonly query: Query;
}

export interface OSMonitor {
    readonly name: string;
    /** Cron expression in UTC since AWS EventBridge in use only supports scheduling in UTC. */
    readonly cron: string;
    readonly indices: string[];
    readonly query: OSQueryData;
    readonly triggers: OSTrigger[];
}

export function opensearchMonitor(osMonitor: OSMonitor): unknown {
    return {
        name: osMonitor.name,
        type: "monitor",
        monitor_type: "query_level_monitor",
        schedule: {
            cron: {
                expression: osMonitor.cron,
                timezone: "UTC"
            }
        },
        ui_metadata: {
            schedule: {
                timezone: "UTC",
                frequency: "cronExpression",
                cronExpression: osMonitor.cron
            }
        },
        inputs: [
            {
                search: {
                    indices: osMonitor.indices,
                    query: osMonitor.query
                }
            }
        ],
        triggers: osMonitor.triggers.map((trigger) => ({
            query_level_trigger: {
                name: trigger.name,
                severity: 1,
                condition: {
                    script: {
                        source: trigger.condition,
                        lang: "painless"
                    }
                },
                actions: trigger.actions.map((action, i) => ({
                    name: "Slack alert" + (i ? ` ${i + 1}` : ""),
                    destination_id: action.destination,
                    subject_template: {
                        source: action.subject || " ",
                        lang: "mustache"
                    },
                    message_template: {
                        source: action.message || " ",
                        lang: "mustache"
                    },
                    throttle_enabled: true,
                    throttle: {
                        value: action.throttleMinutes,
                        unit: "MINUTES"
                    }
                }))
            }
        }))
    };
}
