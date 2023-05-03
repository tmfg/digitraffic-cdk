import { OSLogField } from "./fields";
import { OSMonitor } from "./monitor";
import {
    BoolQuery,
    ExistsQuery,
    MatchPhraseQuery,
    MustQuery,
    Order,
    Query,
    RangeQuery,
    Sort
} from "./queries";
import { OSTrigger, triggerWhenLineCountOutside, triggerWhenLinesFound } from "./triggers";

export interface MonitorConfig {
    env: string;
    index: string;
    cron: string;
    rangeInMinutes: number;
    phrases: Query[];
    slackDestinations: string[];
    throttleMinutes: number;
    messageSubject: string;
}

export function matchPhrase(field: OSLogField, query: string): MatchPhraseQuery {
    return { match_phrase: { [field]: { query } } };
}

export function exists(field: string): ExistsQuery {
    return {
        exists: {
            field
        }
    };
}

function bool(bool: BoolQuery["bool"]): BoolQuery {
    return { bool };
}

function must(queries: Query[]): MustQuery {
    return { must: queries };
}

function sort(field: OSLogField, order: Order): Sort {
    return { [field]: { order } };
}

function createTimeRange(minutes: number): RangeQuery {
    return matchRange("@timestamp", `now-${minutes}m`, null);
}

/** inclusive range */
export function matchRange(
    field: OSLogField,
    from: string | number | null,
    to: string | number | null
): RangeQuery {
    return { range: { [field]: { from, to } } };
}

function getThrottle(config: MonitorConfig): number {
    return config.throttleMinutes ?? config.rangeInMinutes * 2;
}

export class OsMonitorBuilder {
    readonly config: MonitorConfig;

    readonly name: string;
    readonly cron: string;
    readonly index: string;
    readonly destinations: string[];
    readonly phrases: Query[];

    messageSubject: string;
    rangeInMinutes: number;
    trigger: OSTrigger;

    constructor(name: string, config: MonitorConfig) {
        this.config = config;
        this.name = `${config.env.toUpperCase()} ${name}`;
        this.cron = config.cron;
        this.index = config.index;
        this.destinations = config.slackDestinations;
        this.messageSubject = config.messageSubject;
        this.rangeInMinutes = config.rangeInMinutes;
        this.phrases = ([] as Query[]).concat(config.phrases);
        this.trigger = triggerWhenLinesFound(
            this.name,
            this.destinations,
            getThrottle(config),
            this.messageSubject
        );
    }

    level(level: string): this {
        return this.and(matchPhrase("level", level));
    }

    logLine(value: string): this {
        return this.and(matchPhrase("log_line", value));
    }

    app(value: string): this {
        return this.and(matchPhrase("app", value));
    }

    loggerName(value: string): this {
        return this.and(matchPhrase("logger_name", value));
    }

    logGroup(value: string): this {
        return this.and(matchPhrase("@log_group", value));
    }

    logStream(value: string): this {
        return this.and(matchPhrase("@log_stream", value));
    }

    match(field: OSLogField, value: string): this {
        return this.and(matchPhrase(field, value));
    }

    withMessageSubject(subject: string): this {
        this.messageSubject = subject;

        return this;
    }

    and(...phrases: Query[]): this {
        this.phrases.push(...phrases);

        return this;
    }

    /**
     * Timerange in minutes
     */
    minutes(minutes: number): this {
        this.rangeInMinutes = minutes;

        return this;
    }

    /**
     * trigger when outside inclusive range
     */
    notInRange(from: number, to: number): this {
        this.trigger = triggerWhenLineCountOutside(
            this.name,
            this.destinations,
            getThrottle(this.config),
            from,
            to,
            this.messageSubject
        );

        return this;
    }

    moreThan(threshold: number): this {
        this.trigger = triggerWhenLinesFound(
            this.name,
            this.destinations,
            getThrottle(this.config),
            this.messageSubject,
            threshold
        );

        return this;
    }

    build(): OSMonitor {
        return {
            name: this.name,
            cron: this.cron,
            indices: [this.index],
            query: {
                size: 1,
                query: bool(must([createTimeRange(this.rangeInMinutes), ...this.phrases])),
                sort: [sort("@timestamp", "desc")]
            },

            triggers: [this.trigger]
        };
    }
}
