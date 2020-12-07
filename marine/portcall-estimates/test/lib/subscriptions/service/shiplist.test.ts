import * as ShiplistService from "../../../../lib/subscriptions/service/shiplist";
import {dbTestBase, inTransaction} from "../../db-testutil";
import {ApiEstimate, EventType} from "../../../../lib/estimates/model/estimate";
import {updateEstimate} from "../../../../lib/estimates/db/db-estimates";
import {EVENTSOURCE_PORTNET, EVENTSOURCE_VTS} from "../../../../lib/event-sourceutil";
import {newEstimate} from "../../testdata";

const moment = require('moment-timezone');

const TEST_LOCODE = 'TESTLOC';

const eventTime = moment.tz();
eventTime.milliseconds(0);

const TEST_ESTIMATE = {
    event_type: 'ETA',
    event_time: eventTime,
    event_source: 'TEST',
    ship_imo: 1,
    ship_name: 'TEST_SHIP',
    portcall_id: 1,
    coalesce_id: "1",
};

const TEST_MMSI = 12345;
const TEST_IMO = 67890;
const LOCODE_RAUMA = "FIRAU";

const DEFAULT_ESTIMATE = {
    eventType: EventType.ETA,
    locode: LOCODE_RAUMA,
    portcallId: 1,
    mmsi: TEST_MMSI,
    imo: TEST_IMO,
};


describe('subscriptions', dbTestBase((db) => {
    async function createEstimate(override?: any): Promise<ApiEstimate> {
        console.info("creating estimate %s as string %s", eventTime, eventTime.toISOString());

        const estimate = newEstimate({...DEFAULT_ESTIMATE, ...override});

        await updateEstimate(db, estimate);

        eventTime.add(1, 'hours');

        return estimate;
    }

    test('convertToSms - empty', async () => {
        const sms = ShiplistService.convertToSms(TEST_LOCODE, []);

        expect(sms).toContain(TEST_LOCODE);
        expect(sms).toContain("No estimates");
    });

    test('convertToSms - one estimate', async () => {
        const sms = ShiplistService.convertToSms(TEST_LOCODE, [TEST_ESTIMATE]);

        expect(sms).toContain(TEST_LOCODE);
        expect(sms).toContain('\n');
        expect(sms).toContain(TEST_ESTIMATE.ship_name);
        expect(sms).toContain(TEST_ESTIMATE.event_time.tz('Europe/Helsinki').format("HH:mm"));
    });

    test('findByLocodeAndImo - different sources', inTransaction(db, async (t: any) => {
        await createEstimate({source: EVENTSOURCE_VTS, portcallId: 1});
        await createEstimate({source: EVENTSOURCE_PORTNET, portcallId: 1});

        const estimates = await ShiplistService.getEstimates("0700", LOCODE_RAUMA);

        expect(estimates.length).toBe(1);
        expect(estimates[0].event_source).toBe(EVENTSOURCE_VTS);
    }));

    test('findByLocodeAndImo - different sources multiple portcalls', inTransaction(db, async (t: any) => {
        const e1 = await createEstimate({source: EVENTSOURCE_VTS, portcallId: 1});
        const e2 = await createEstimate({source: EVENTSOURCE_PORTNET, portcallId: 1});
        const e3 = await createEstimate({source: EVENTSOURCE_PORTNET, portcallId: 2, mmsi: TEST_MMSI + 1, imo: TEST_IMO + 1});
        const e4 = await createEstimate({source: EVENTSOURCE_VTS, portcallId: 2, mmsi: TEST_MMSI + 1, imo: TEST_IMO + 1});

        const estimates = await ShiplistService.getEstimates("0700", LOCODE_RAUMA);

        expect(estimates.length).toBe(2);
        expect(estimates[0].event_source).toBe(EVENTSOURCE_VTS);
        expect(estimates[0].event_time.toISOString()).toBe(e1.eventTime);
        expect(estimates[1].event_source).toBe(EVENTSOURCE_VTS);
        expect(estimates[1].event_time.toISOString()).toBe(e4.eventTime);
    }));

}));
