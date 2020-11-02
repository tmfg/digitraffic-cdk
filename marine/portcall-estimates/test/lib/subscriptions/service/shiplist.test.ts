import {convertToSms} from "../../../../lib/subscriptions/service/shiplist";

const moment = require('moment-timezone');

const TEST_LOCODE = 'TESTLOC';
const TEST_EVENT_TIME = new Date();

const TEST_ESTIMATE = {
    event_type: 'ETA',
    event_time: TEST_EVENT_TIME,
    event_source: 'TEST',
    ship_imo: 1,
    ship_name: 'TEST_SHIP',
    portcall_id: 1
};

describe('subscriptions', () => {

    test('convertToSms - empty', async () => {
        const sms = convertToSms(TEST_LOCODE, []);

        expect(sms).toContain(TEST_LOCODE);
        expect(sms).toContain("No estimates");
    });

    test('convertToSms - one estimate', async () => {
        const sms = convertToSms(TEST_LOCODE, [TEST_ESTIMATE]);

        expect(sms).toContain(TEST_LOCODE);
        expect(sms).toContain('\n');
        expect(sms).toContain(TEST_ESTIMATE.ship_name);
        expect(sms).toContain(moment(TEST_EVENT_TIME).tz('Europe/Helsinki').format("HH:mm"));
    });

});
