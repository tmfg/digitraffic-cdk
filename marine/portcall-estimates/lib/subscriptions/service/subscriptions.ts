import {EstimateSubscription, validateSubscription} from "../model/subscription";
import {DynamoDB} from 'aws-sdk';

const { v4: uuidv4 } = require('uuid');

const ddb = new DynamoDB.DocumentClient();

enum SubscriptionType {
    VESSEL_LIST= "VESSEL_LIST"
}

export async function addSubscription(
    subscription: EstimateSubscription) {

    if (validateSubscription(subscription)) {
        console.log(`Adding subscription for LOCODE ${subscription.locode}, at time ${subscription.time}`);

        createSubscription(subscription);
    } else {
        console.error('Invalid subscription');
    }
}

function createSubscription(subscription: EstimateSubscription) {
    ddb.put({
        TableName: 'PESubscriptions',
        Item: {
            "ID": uuidv4(),
            "Time": subscription.time,
            "Type": SubscriptionType.VESSEL_LIST,
            "Locode": subscription.locode,
            "PhoneNumber": subscription.phoneNumber
        }
    }, (err: any) => {
        if (err) {
            console.log("Error", err);
        }
    })
}
