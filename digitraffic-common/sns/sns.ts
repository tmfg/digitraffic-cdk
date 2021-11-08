import {SNS} from "aws-sdk";

/**
 * Utility function for publishing SNS messages.
 * Made because using *await* with AWS APIs doesn't require calling promise() but nothing works if it isn't called.
 * Retries a single time in case of failure.
 * @param message
 * @param topicArn
 * @param sns
 */
export async function snsPublish(message: string, topicArn: string, sns: SNS) {
    const publishParams = {
        Message: message,
        TopicArn: topicArn
    };
    try {
        await sns.publish(publishParams).promise();
        try {
            await sns.publish(publishParams).promise();
        } finally {}
    } catch (error) {
        console.error('method=snsPublish error', error);
    }
}
