import {DYNAMODB_TIME_FORMAT, listSubscriptions} from "../../service/subscriptions";

const moment = require('moment-timezone');

export async function handler() {
    const time = moment.tz(new Date(), "Europe/Helsinki").format(DYNAMODB_TIME_FORMAT);
    const subscriptions = await listSubscriptions(time);

    console.log("active subscriptions for %s, %s", time, JSON.stringify(subscriptions));
}
