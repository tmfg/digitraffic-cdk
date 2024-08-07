import _ from "lodash";
import type { SQSEvent, SQSMessageAttribute } from "aws-lambda";
import type { Message, MessageAttributeValue, ReceiveMessageCommandOutput } from "@aws-sdk/client-sqs";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import ExtendedSqsClient from "sqs-extended-client";
import { MaintenanceTrackingEnvKeys } from "../keys.js";

export function createExtendedSqsClient(): ExtendedSqsClient {
    return new ExtendedSqsClient({
        bucketName: getEnvVariable(MaintenanceTrackingEnvKeys.SQS_BUCKET_NAME),
        // alwaysUseS3: true If also small messages should go through S3
        sqsClientConfig: {
            region: getEnvVariable("AWS_REGION")
        }
    });
}

export function createSqsReceiveMessageCommandOutput(event: SQSEvent): ReceiveMessageCommandOutput {
    const messages: Message[] = event.Records.map((r) => {
        const messageAttributes: Record<string, MessageAttributeValue> = {};
        _.keys(r.messageAttributes).map((key) => {
            const value: SQSMessageAttribute | undefined = r.messageAttributes[key];
            // We are actually only interested of key: S3MessageBodyKey
            if (value?.stringValue && (value.dataType === "String" || value.dataType === "string")) {
                const mav: MessageAttributeValue = {
                    StringValue: value.stringValue,
                    DataType: "String"
                };
                _.set(messageAttributes, key, mav);
            }
        });

        return {
            MessageId: r.messageId,
            ReceiptHandle: r.receiptHandle,
            MD5OfBody: r.md5OfBody,
            Body: r.body,
            //Attributes: don't care
            //MD5OfMessageAttributes: don't care
            // Here we have reference to S3
            MessageAttributes: messageAttributes
        } satisfies Message;
    });

    /* E.g.
        "Messages": [
                {
                    "MessageId": "82b641a9-7698-4848-b32a-233bba3a988b",
                    "ReceiptHandle": "AQEBu9x6OsqxUUE05JzHcsRo/sx+fQ7NcDpxB+A1iKJKIATSPyW1xNc3YRBg4kqQWFQi/yn8DfTqWR/Wmkyg4iQz1OKh3HSCK+oGh8a5WFAMEXIyyfyowH/So5Nd8rxSaj+xzDENIGtHg3IYxjBp2G9QnAiNlL37wg6jB/LFKFiEeDHbFp+ooT1XYIiQ1eNYip5kJMwuQxGJzrO2w9WWiE0Dba/xl8rnx8RgPaKxwxNi8CbZjeJ3QSqG7AfEttE5jbcyRqSNXaw3vjToXWkBIt+D0qv9oa/RUd3u+cgxXzyFLY7I53XD1J8i+1m3MokOejinwWwSf3kPz3JmGeAHwvjNV1SdpvTKaIcWPXLvPnVNKAbWOxVq43kE828gOVCO0odIgUQc24YymI26Ucpm70mIWw==",
                    "MD5OfBody": "bc0287471fb8c8e264055cab7a6ac3f7",
                    "Body": "a7faf17e-d450-49cf-aebc-92bf5ab63aca",
                    "MessageAttributes": {
                        "S3MessageBodyKey": {
                            "StringValue": "(sqs-s2-bucket-name-maintenance-tracking)a7faf17e-d450-49cf-aebc-92bf5ab63aca",
                            "DataType": "String"
                        }
                    }
                }
            ],
            "$metadata": {}
        }
     */

    return {
        Messages: messages,
        $metadata: {}
    } satisfies ReceiveMessageCommandOutput;
}
