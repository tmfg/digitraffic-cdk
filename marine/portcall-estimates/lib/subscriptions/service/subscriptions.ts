import {EstimateSubscription, TIME_FORMAT, validateSubscription} from "../model/subscription";
import {DynamoDB} from 'aws-sdk';
import moment, {Moment} from 'moment';

const { v4: uuidv4 } = require('uuid');

const ddb = new DynamoDB.DocumentClient();
const DYNAMODB_TIME_FORMAT = 'HHmm';

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
            "Time": moment(subscription.time, TIME_FORMAT, true).format(DYNAMODB_TIME_FORMAT),
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
