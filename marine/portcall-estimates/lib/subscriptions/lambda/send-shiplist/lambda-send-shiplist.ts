import {DYNAMODB_TIME_FORMAT, listSubscriptions} from "../../service/subscriptions";
import moment, {Moment} from 'moment';

export async function handler() {
    // this is zulu time? check timezone, and make sure dynamodb has same timezone times
    const time = moment().format(DYNAMODB_TIME_FORMAT);
    const subs = listSubscriptions(time);

    console.log("active subscriptions for %s, %s", time, JSON.stringify(subs));
}
