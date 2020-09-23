import {EstimateSubscription, TIME_FORMAT, validateSubscription} from "../model/subscription";
import {DynamoDB} from 'aws-sdk';
import moment, {Moment} from 'moment';
import {sendOKMessage, sendValidationFailedMessage} from "./pinpoint";

const { v4: uuidv4 } = require('uuid');

const ddb = new DynamoDB.DocumentClient();
const DYNAMODB_TIME_FORMAT = 'HHmm';

enum SubscriptionType {
    VESSEL_LIST= "VESSEL_LIST"
}

export async function addSubscription(subscription: EstimateSubscription) {
    if (validateSubscription(subscription)) {
        console.log(`Adding subscription for LOCODE ${subscription.locode}, at time ${subscription.time}`);

        await createSubscription(subscription)
            .catch((e) => console.info("error " + e))
            .then(() => sendOKMessage(subscription.phoneNumber))
    } else {
        sendValidationFailedMessage(subscription.phoneNumber);
        console.error('Invalid subscription');
    }
}

async function createSubscription(subscription: EstimateSubscription): Promise<any> {
    const params = {
        TableName: 'PESubscriptions',
        Item: {
            "ID": uuidv4(),
            "Time": moment(subscription.time, TIME_FORMAT, true).format(DYNAMODB_TIME_FORMAT),
            "Type": SubscriptionType.VESSEL_LIST,
            "Locode": subscription.locode.toUpperCase(),
            "PhoneNumber": subscription.phoneNumber
        }
    };

//    console.log("params " + JSON.stringify(params));

    return ddb.put(params).promise();
}