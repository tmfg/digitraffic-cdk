import type { OSAction } from "./triggers.js";

export enum SlackEmoji {
  RED_CIRCLE = ":red_circle:",
  YELLOW_CIRCLE = ":large_yellow_circle:",
  GREEN_CIRCLE = ":large_green_circle:",
}

interface SubjectAndMessage {
  readonly subject: string;
  readonly message?: string;
}

export interface SlackMessage {
  readonly subject: string;
  readonly emoji?: SlackEmoji;
  readonly message?: string;
  readonly url?: string;
}

export interface EmojiConfig {
  readonly failed?: SlackEmoji;
  readonly failedToOk?: SlackEmoji;
}

function defaultMessageFormatter({
  subject,
  message,
  emoji,
}: SlackMessage): SubjectAndMessage {
  return {
    subject: emoji ? `${emoji} ${subject}` : subject,
    message,
  };
}

/** Sends a message to a single destination */
export function sendSlackMessage(
  msg: SlackMessage,
  destination: string,
  throttleMinutes: number = 15,
): OSAction {
  const { subject, message } = defaultMessageFormatter(msg);
  return {
    destination,
    subject,
    message,
    throttleMinutes,
  };
}
