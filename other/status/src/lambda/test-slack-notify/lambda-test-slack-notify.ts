import type { UpdateStatusSecret } from "../../secret.js";
import { SlackApi } from "@digitraffic/common/dist/utils/slack";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";

const secretHolder = SecretHolder.create<UpdateStatusSecret>();

/**
 * Sens test message to Slack Webhook to test notifications.
 */
export const handler = async (): Promise<void> => {
    const secret = await secretHolder.get();
    const slackNotifyApi = new SlackApi(secret.reportUrl);
    await slackNotifyApi.notify(`Test message from status lambda at ${new Date().toUTCString()}`);
};
