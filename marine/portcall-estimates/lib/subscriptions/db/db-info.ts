import {getDocumentClient} from '../../../../../common/dynamodb/dynamodb';
import {DocumentClient} from 'aws-sdk/clients/dynamodb';
import moment from 'moment';

const ddb = getDocumentClient();

// export for testing, same instance is required
export const _ddb: DocumentClient = ddb;

// this table has a single row hence the id constant
export const INFO_TABLE_NAME = 'PortcallEstimates.SubscriptionInfo';
export const INFO_ID_ATTRIBUTE = 'ID';
export const SMS_SENT_AMOUNT_ATTRIBUTE = 'SmsSentAmount';
export const SMS_RECEIVED_AMOUNT_ATTRIBUTE = 'SmsReceivedAmount';

export interface DbSubscriptionInfo {
    readonly SmsSentAmount: number
    readonly SmsReceivedAmount: number
}

export async function getInfo(): Promise<any> {
    return await ddb.query({
        TableName: INFO_TABLE_NAME,
        ExpressionAttributeValues: {
            ':ID': getId()
        },
        KeyConditionExpression: 'ID = :ID'
    }).promise();
}

export async function increaseSmsSentAmount(): Promise<any> {
    return ddb.update({
        TableName: INFO_TABLE_NAME,
        Key: {
            ID: getId()
        },
        UpdateExpression: 'SET SmsSentAmount = if_not_exists(SmsSentAmount, :start) + :inc',
        ExpressionAttributeValues: {
            ':inc': 1,
            ':start': 0
        }
    }).promise();
}

export async function increaseSmsReceivedAmount(): Promise<any> {
    return ddb.update({
        TableName: INFO_TABLE_NAME,
        Key: {
            ID: getId()
        },
        UpdateExpression: 'SET SmsReceivedAmount = if_not_exists(SmsReceivedAmount, :start) + :inc',
        ExpressionAttributeValues: {
            ':inc': 1,
            ':start': 0
        }
    }).promise();
}

export function getId(): string {
    return moment().format('YYYY-MM-DD');
}