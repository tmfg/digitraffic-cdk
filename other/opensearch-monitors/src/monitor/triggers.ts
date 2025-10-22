import { sendSlackMessage, SlackEmoji, type SlackMessage } from "./slack.js";
import { RUNBOOK_SEARCH_TERM } from "./monitor-builder.js";

export interface OSAction {
  readonly destination: string;
  readonly subject: string;
  readonly message?: string;
  readonly throttleMinutes: number;
}

export interface OSTrigger {
  readonly name: string;
  readonly condition: string;
  readonly actions: OSAction[];
}

/**
 * Result count more than threshold, exlusive
 */
function moreThan(threshold: number): string {
  return `ctx.results[0].hits.total.value > ${threshold}`;
}

/**
 * Aggregation bucket count more than threshold, exlusive
 */
function aggMoreThan(aggName: string, threshold: number): string {
  return `ctx.results[0].aggregations.${aggName}.buckets.length > ${threshold}`;
}

/**
 * Result count not in inclusive range
 */
function notBetween(lower: number, upper: number): string {
  return `!(ctx.results[0].hits.total.value >= ${lower} && ctx.results[0].hits.total.value <= ${upper})`;
}

/**
 * Result aggregation sum not in inclusive range
 */
function sumNotBetween(name: string, lower: number, upper: number): string {
  return `!(ctx.results[0].aggregations.sum_${name}.value >= ${lower} && ctx.results[0].aggregations.sum_${name}.value <= ${upper})`;
}

export enum OSMessageSubjects {
  LAMBDA_ERRORS =
    "{{ctx.results.0.hits.hits.0._source.@timestamp}} {{ctx.results.0.hits.hits.0._source.method}} {{ctx.results.0.hits.hits.0._source.message}}",
  JAVA_ERRORS =
    "{{ctx.results.0.hits.hits.0._source.@timestamp}} {{ctx.results.0.hits.hits.0._source.logger_name}} {{ctx.results.0.hits.hits.0._source.message}} in {{ctx.results.0.hits.hits.0._source.app}}",
  LAMBDA_TIMEOUT =
    "{{ctx.results.0.hits.hits.0._source.@timestamp}} {{ctx.results.0.hits.hits.0._source.@log_group}}",
}

/** Sends a message to all given destinations */
function sendAlerts(
  destinations: string[],
  message: SlackMessage,
  throttleMinutes?: number,
): OSAction[] {
  return destinations.map((destination) =>
    sendSlackMessage(message, destination, throttleMinutes)
  );
}

/**
 * @param runbookSearchLink e.g. https://example.com/search/SEARCH_TERM
 * @param term e.g. RUNBOOK-A1
 * @return https://example.com/search/RUNBOOK-A1
 */
function makeRunbookLink(runbookSearchLink: string, term: string): string {
  const url = runbookSearchLink.replace(
    RUNBOOK_SEARCH_TERM,
    encodeURIComponent(term),
  );
  return `<${url}|${term}>`;
}

/**
 * Rplaces name string containing RUNBOOK-XX with Slack link
 * e.g. <https://example.com|RUNBOOK-A1>
 * @param name e.g. ROAD TST RUNBOOK-A1
 * @param runbookSearchLink e.g. https://example.com/search/SEARCH_TERM
 */
function replaceRunbookWithSearchLink(
  name: string,
  runbookSearchLink: string,
): string {
  return name.replace(/\bRUNBOOK-[A-Z0-9]+\b/g, (match: string) => {
    return makeRunbookLink(runbookSearchLink, match);
  });
}

export function triggerWhenSumOutside(
  name: string,
  runbookSearchLink: string,
  field: string,
  destinations: string[],
  throttleMinutes: number,
  betweenLower: number,
  betweenUpper: number,
  message: string,
): OSTrigger {
  const msg: SlackMessage = {
    emoji: SlackEmoji.RED_CIRCLE,
    subject: `${
      replaceRunbookWithSearchLink(name, runbookSearchLink)
    } should be between ${betweenLower} MB and ${betweenUpper} MB, was {{ctx.results.0.aggregations.sum_${field}.value}} MB`,
    message,
  };
  return {
    name: name,
    condition: sumNotBetween(field, betweenLower, betweenUpper),
    actions: sendAlerts(destinations, msg, throttleMinutes),
  };
}

export function triggerWhenLinesFound(
  name: string,
  runbookSearchLink: string,
  destinations: string[],
  throttleMinutes: number,
  message: string,
  threshold: number = 0,
): OSTrigger {
  const msg: SlackMessage = {
    emoji: SlackEmoji.RED_CIRCLE,
    subject: `${
      replaceRunbookWithSearchLink(name, runbookSearchLink)
    } {{ctx.results.0.hits.total.value}} should not be more than ${threshold}`,
    message,
  };
  return {
    name: name,
    condition: moreThan(threshold),
    actions: sendAlerts(destinations, msg, throttleMinutes),
  };
}

export function triggerAlways(
  name: string,
  runbookSearchLink: string,
  destinations: string[],
  throttleMinutes: number,
  message: string,
): OSTrigger {
  const msg: SlackMessage = {
    emoji: SlackEmoji.RED_CIRCLE,
    subject: `${name}`,
    message,
  };
  return {
    name: replaceRunbookWithSearchLink(name, runbookSearchLink),
    condition: "true",
    actions: sendAlerts(destinations, msg, throttleMinutes),
  };
}

export function triggerWhenAggregationBucketsFound(
  name: string,
  runbookSearchLink: string,
  aggName: string,
  destinations: string[],
  throttleMinutes: number,
  message: string,
  threshold: number = 0,
): OSTrigger {
  const msg: SlackMessage = {
    emoji: SlackEmoji.RED_CIRCLE,
    subject:
      `${name} {{ctx.results.0.aggregations.${aggName}.buckets.length}} should not be more than ${threshold}`,
    message,
  };
  return {
    name: replaceRunbookWithSearchLink(name, runbookSearchLink),
    condition: aggMoreThan(aggName, threshold),
    actions: sendAlerts(destinations, msg, throttleMinutes),
  };
}

export function triggerWhenLineCountOutside(
  name: string,
  runbookSearchLink: string,
  destinations: string[],
  throttleMinutes: number,
  betweenLower: number,
  betweenUpper: number,
  message: string,
): OSTrigger {
  const msg: SlackMessage = {
    emoji: SlackEmoji.RED_CIRCLE,
    subject: `${
      replaceRunbookWithSearchLink(name, runbookSearchLink)
    } should be between ${betweenLower} and ${betweenUpper}, was {{ctx.results.0.hits.total.value}}`,
    message,
  };
  return {
    name: name,
    condition: notBetween(betweenLower, betweenUpper),
    actions: sendAlerts(destinations, msg, throttleMinutes),
  };
}
