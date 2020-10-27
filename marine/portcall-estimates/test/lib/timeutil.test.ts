import {getStartTimeForShiplist} from "../../lib/subscriptions/timeutil";
import moment from "moment-timezone";

describe('timeutil', () => {

    test('getStartTimeForShiplist - ', () => {
        expect(getStartTimeForShiplist('0735')).toMatchObject(
            moment().hours(7).minutes(35).seconds(0).tz('Europe/Helsinki').milliseconds(0).toDate())
    });

});