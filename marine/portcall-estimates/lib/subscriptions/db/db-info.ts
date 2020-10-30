import {getDocumentClient} from 'digitraffic-dynamodb/dynamodb';
import {DocumentClient} from "aws-sdk/clients/dynamodb";

const ddb = getDocumentClient();

// export for testing, same instance is required
export const _ddb: DocumentClient = ddb;

// this table has a single row hence the id constant
export const INFO_TABLE_NAME = "PortcallEstimates.SubscriptionInfo";
export const INFO_ID_ATTRIBUTE = "ID";
export const SMS_SENT_AMOUNT_ATTRIBUTE = 'SmsSentAmount';
export const SMS_RECEIVED_AMOUNT_ATTRIBUTE = 'SmsReceivedAmount';
export const ID_VALUE = '1'

export interface DbSubscriptionInfo {
    readonly SmsSentAmount: number
    readonly SmsReceivedAmount: number
}

export async function getInfo(): Promise<any> {
    return await ddb.query({
        TableName: INFO_TABLE_NAME,
        ExpressionAttributeValues: {
            ":ID": ID_VALUE
        },
        KeyConditionExpression: 'ID = :ID'
    }).promise();
}

export async function increaseSmsSentAmount(): Promise<any> {
    return ddb.update({
        TableName: INFO_TABLE_NAME,
        Key: {
            ID: ID_VALUE
        },
        UpdateExpression: "SET SmsSentAmount = SmsSentAmount + :inc",
        ExpressionAttributeValues: { ":inc": 1 }
    }).promise();
}

export async function increaseSmsReceivedAmount(): Promise<any> {
    return ddb.update({
        TableName: INFO_TABLE_NAME,
        Key: {
            ID: ID_VALUE
        },
        UpdateExpression: "SET SmsReceivedAmount = SmsReceivedAmount + :inc",
        ExpressionAttributeValues: { ":inc": 1 }
    }).promise();
}
