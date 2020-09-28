import {EstimateSubscription, TIME_FORMAT, validateSubscription} from "../model/subscription";
import {DynamoDB} from 'aws-sdk';
import moment, {Moment} from 'moment';
import {sendMessage, sendValidationFailedMessage} from "./pinpoint";

const { v4: uuidv4 } = require('uuid');

const ddb = new DynamoDB.DocumentClient();
const DYNAMODB_TIME_FORMAT = 'HHmm';

export const SUBSCRIPTIONS_TABLE_NAME = "PortcallEstimates.Subscriptions";
export const SUBSCRIPTIONS_PHONENUMBER_IDX_NAME = 'PortcallEstimateSubscriptions_PhoneNumber_Idx';

enum SubscriptionType {
    VESSEL_LIST= "VESSEL_LIST"
}

interface DbSubscription {
    readonly ID: string
    readonly PhoneNumber: string
    readonly Locode: string
    readonly Time: string
}

export async function addSubscription(subscription: EstimateSubscription) {
    if (validateSubscription(subscription)) {
        console.log(`Adding subscription for LOCODE ${subscription.locode}, at time ${subscription.time}`);
        await createSubscription(subscription);
    } else {
        await sendValidationFailedMessage(subscription.phoneNumber);
        console.error('Invalid subscription');
    }
}

export async function sendSubscriptionList(destinationNumber: string) {
    const dbSubs = await ddb.query({
        TableName: SUBSCRIPTIONS_TABLE_NAME,
        IndexName: SUBSCRIPTIONS_PHONENUMBER_IDX_NAME,
        ExpressionAttributeValues: {
            ":PhoneNumber": destinationNumber
        },
        KeyConditionExpression: 'PhoneNumber = :PhoneNumber'
    }).promise();
    const subs = (dbSubs.Items as DbSubscription[])?.map(s => `${s.Locode} ${s.Time}`).join('\n');
    await sendMessage(subs, destinationNumber);
}

async function createSubscription(subscription: EstimateSubscription): Promise<any> {
    const params = {
        TableName: SUBSCRIPTIONS_TABLE_NAME,
        Item: {
            "ID": uuidv4(),
            "Time": moment(subscription.time, TIME_FORMAT, true).format(DYNAMODB_TIME_FORMAT),
            "Type": SubscriptionType.VESSEL_LIST,
            "Locode": subscription.locode.toUpperCase(),
            "PhoneNumber": subscription.phoneNumber
        }
    };

    return ddb.put(params).promise();
}