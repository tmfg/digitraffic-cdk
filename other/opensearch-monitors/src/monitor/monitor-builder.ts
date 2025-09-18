import type { OSLogField } from "./fields.js";
import type { OSMonitor } from "./monitor.js";
import type {
  BoolOrQuery,
  BoolQuery,
  ExistsQuery,
  MatchPhraseQuery,
  MultiMatchPhraseQuery,
  Order,
  PrefixQuery,
  Query,
  QueryStringQuery,
  RangeQuery,
  RegExpQuery,
  ScriptedMetric,
  ScriptQuery,
  Sort,
  WildcardQuery,
} from "./queries.js";
import {
  type OSTrigger,
  triggerAlways,
  triggerWhenAggregationBucketsFound,
  triggerWhenLineCountOutside,
  triggerWhenLinesFound,
  triggerWhenSumOutside,
} from "./triggers.js";
import type { AggregateFilter, TermsAggregate } from "./aggregates.js";

export type OsDomain =
  | "marine"
  | "road"
  | "rail"
  | "afir"
  | "catalog"
  | "parking"
  | "status"
  | "tis"
  | "cloudfront"
  | "weathercam"
  | "portactivity";

export interface MonitorConfig {
  domain: OsDomain;
  env: string;
  index: string;
  cron: string;
  rangeInMinutes: number;
  delayInMinutes?: number;
  phrases: Query[];
  aggs?: AggregateFilter[];
  slackDestinations: string[];
  throttleMinutes: number;
  messageSubject: string;
}

export function queryString(query: string): QueryStringQuery {
  return { query_string: { query } };
}

export function matchPhrase(
  field: OSLogField,
  query: string,
): MatchPhraseQuery {
  return { match_phrase: { [field]: { query } } };
}

export function matchPrefix(
  field: OSLogField,
  query: string,
): PrefixQuery {
  return { prefix: { [field]: query } };
}

export function multiMatchPhrase(
  field: OSLogField | OSLogField[],
  query: string,
): MultiMatchPhraseQuery {
  return {
    multi_match: {
      query,
      fields: Array.isArray(field) ? field : [field],
      type: "phrase",
    },
  };
}

export function matchWildcardPhrase(
  field: OSLogField,
  value: string,
): WildcardQuery {
  return { wildcard: { [field]: { value } } };
}

export function matchRegExpPhrase(
  field: OSLogField,
  value: string,
): RegExpQuery {
  return { regexp: { [field]: { value } } };
}

export function aggregateTerms(
  field: OSLogField,
  { name, bucketFilter, innerAggregate }: {
    name?: string;
    bucketFilter?: AggregateFilter;
    innerAggregate?: TermsAggregate;
  },
): TermsAggregate {
  name = name ?? field.replace(".", "_");
  return {
    [name]: {
      terms: {
        field: field,
      },
      ...(innerAggregate && {
        aggregations: innerAggregate,
      }),
      ...(bucketFilter && {
        aggregations: {
          [bucketFilter.name]: {
            bucket_selector: {
              buckets_path: bucketFilter.bucketPaths,
              script: bucketFilter.script,
            },
          },
        },
      }),
    },
  };
}

/* { "script" : { "script" : "doc['record.metrics.memorySizeMB'].value - doc['record.metrics.maxMemoryUsedMB'].value < 20" }} */
export function script(script: string): ScriptQuery {
  return { script: { script: script } };
}

export function exists(field: string): ExistsQuery {
  return {
    exists: {
      field,
    },
  };
}

function bool(must: Query[], mustNot: Query[]): BoolQuery {
  return {
    bool: {
      must,
      must_not: mustNot,
    },
  };
}

export function or(...queries: Query[]): BoolOrQuery {
  return {
    bool: {
      should: queries,
    },
  };
}

function sort(field: OSLogField, order: Order): Sort {
  return { [field]: { order } };
}

function createTimeRange(
  minutes: number,
  minutesTo: number | undefined = undefined,
): RangeQuery {
  return matchRange(
    "@timestamp",
    `now-${minutes}m`,
    minutesTo === undefined ? null : `now-${minutesTo}m`,
  );
}

/** inclusive range */
export function matchRange(
  field: OSLogField,
  // eslint-disable-next-line @rushstack/no-new-null
  from: string | number | null,
  // eslint-disable-next-line @rushstack/no-new-null
  to: string | number | null,
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
  readonly phrases: Query[];
  readonly notPhrases: Query[];
  readonly aggs: ScriptedMetric | TermsAggregate;

  messageSubject: string;
  messageLink?: string;
  rangeInMinutes: number;
  delayInMinutes?: number;
  trigger: OSTrigger;

  constructor(name: string, config: MonitorConfig) {
    this.config = config;
    this.name =
      `${config.domain.toUpperCase()} ${config.env.toUpperCase()} ${name}`;
    this.cron = config.cron;
    this.index = config.index;
    this.messageSubject = config.messageSubject;
    this.rangeInMinutes = config.rangeInMinutes;
    this.delayInMinutes = config.delayInMinutes;
    this.phrases = ([] as Query[]).concat(config.phrases);
    this.notPhrases = [];
    this.aggs = {};
    this.trigger = triggerWhenLinesFound(
      this.name,
      this.config.slackDestinations,
      getThrottle(config),
      this.messageSubject,
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

  /** recreate trigger after you call this! */
  withMessage(subject: string, link: string | undefined = undefined): this {
    this.messageSubject = subject;

    if (link) {
      this.messageSubject += ` <${link}|Opensearch>`;
    }

    return this;
  }

  and(...phrases: Query[]): this {
    this.phrases.push(...phrases);

    return this;
  }

  not(...phrases: Query[]): this {
    this.notPhrases.push(...phrases);

    return this;
  }

  /**
   * Timerange in minutes
   */
  minutes(minutes: number): this {
    this.rangeInMinutes = minutes;

    return this;
  }

  delay(minutes: number): this {
    this.delayInMinutes = minutes;

    return this;
  }

  /**
   * trigger when outside inclusive range
   */
  notInRange(from: number, to: number): this {
    this.trigger = triggerWhenLineCountOutside(
      this.name,
      this.config.slackDestinations,
      getThrottle(this.config),
      from,
      to,
      this.messageSubject,
    );

    return this;
  }

  moreThan(threshold: number = 0): this {
    this.trigger = triggerWhenLinesFound(
      this.name,
      this.config.slackDestinations,
      getThrottle(this.config),
      this.messageSubject,
      threshold,
    );

    return this;
  }

  always(): this {
    this.trigger = triggerAlways(
      this.name,
      this.config.slackDestinations,
      getThrottle(this.config),
      this.messageSubject,
    );

    return this;
  }

  aggregationBucketsMoreThan(aggName: string, threshold: number = 0): this {
    this.trigger = triggerWhenAggregationBucketsFound(
      this.name,
      aggName,
      this.config.slackDestinations,
      getThrottle(this.config),
      this.messageSubject,
      threshold,
    );

    return this;
  }

  sum(field: string, betweenLower: number, betweenUpper: number): this {
    this.aggs[`sum_${field}`] = {
      "scripted_metric": {
        "init_script": "state.responses = ['total': 0L]",
        "map_script": "state.responses.total+= doc['bytes'].value",
        "combine_script": "state.responses",
        "reduce_script":
          "def sum = ['total': 0L]; for (responses in states) { sum.total += responses['total']; } return (sum.total / (1000*1000));",
      },
    };

    this.trigger = triggerWhenSumOutside(
      this.name,
      field,
      this.config.slackDestinations,
      getThrottle(this.config),
      betweenLower,
      betweenUpper,
      this.messageSubject,
    );

    return this;
  }

  aggregate(agg: TermsAggregate): this {
    const key = Object.keys(agg)[0];
    if (key !== undefined) {
      const val = agg[key];
      if (val === undefined) {
        throw new Error(`Aggregate ${key} is undefined`);
      }
      this.aggs[key] = val;
    }
    return this;
  }

  build(): OSMonitor {
    return {
      name: this.name,
      cron: this.cron,
      indices: [this.index],
      query: {
        size: 1,
        query: bool(
          [
            createTimeRange(this.rangeInMinutes, this.delayInMinutes),
            matchPhrase("env", this.config.env),
            ...this.phrases,
          ],
          this.notPhrases,
        ),
        sort: [sort("@timestamp", "desc")],
      },

      aggregations: this.aggs,
      triggers: [this.trigger],
    };
  }
}
