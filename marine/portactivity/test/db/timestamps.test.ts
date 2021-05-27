import moment from 'moment';
import * as pgPromise from "pg-promise";
import {dbTestBase, insert, insertPortAreaDetails, insertPortCall,} from "../db-testutil";
import {newPortAreaDetails, newPortCall, newTimestamp} from "../testdata";
import * as TimestampsDb from "../../lib/db/timestamps";
import {ApiTimestamp, EventType} from "../../lib/model/timestamp";
import {EVENTSOURCE_VTS} from "../../lib/event-sourceutil";

describe('db-timestamps', dbTestBase((db: pgPromise.IDatabase<any, any>) => {
    test('removeTimestamps - empty', async () => {
        const removed = await TimestampsDb.removeTimestamps(db, []);

        expect(removed).toEqual(0);
    });

    test('removeTimestamps - not found', async () => {
        const removed = await TimestampsDb.removeTimestamps(db, [createTimestampToRemove(123, '123', new Date())]);

        expect(removed).toEqual(0);
    });

    test('removeTimestamps - found 1', async () => {
        const imo = 123;
        const locode = 'FITST';
        const eventTime = new Date();

        await insert(db, [newTimestamp({ imo, locode, eventTime }), newTimestamp()]);

        const notRemoved = await TimestampsDb.removeTimestamps(db, [createTimestampToRemove(imo, 'NOT_FOUND', eventTime)]);
        expect(notRemoved).toEqual(0);

        const removed = await TimestampsDb.removeTimestamps(db, [createTimestampToRemove(imo, locode, eventTime)]);
        expect(removed).toEqual(1);
    });

    /*
        FOUND
     */
    test('findByMmsi - found', async () => {
        const timestamp = Object.assign(newTimestamp(), {
            recordTime: moment().toISOString() // avoid filtering
        });
        await insert(db, [timestamp]);

        const foundTimestamp = await TimestampsDb.findByMmsi(db, timestamp.ship.mmsi!!);
        expect(foundTimestamp.length).toBe(1);
    });

    test('findByImo - found', async () => {
        const timestamp = Object.assign(newTimestamp(), {
            recordTime: moment().toISOString() // avoid filtering
        });
        await insert(db, [timestamp]);

        const foundTimestamp = await TimestampsDb.findByImo(db, timestamp.ship.imo!!);
        expect(foundTimestamp.length).toBe(1);
    });

    test('findByLocode - found', async () => {
        const timestamp = Object.assign(newTimestamp(), {
            recordTime: moment().toISOString() // avoid filtering
        });
        await insert(db, [timestamp]);

        const foundTimestamp = await TimestampsDb.findByLocode(db, timestamp.location.port);
        expect(foundTimestamp.length).toBe(1);
    });

    /*
        NOT FOUND
     */
    test('findByMmsi - not found', async () => {
        const timestamp = Object.assign(newTimestamp(), {
            recordTime: moment().toISOString() // avoid filtering
        });
        await insert(db, [timestamp]);

        const foundTimestamp = await TimestampsDb.findByMmsi(db, timestamp.ship.mmsi!! - 1);
        expect(foundTimestamp.length).toBe(0);
    });

    test('findByImo - not found', async () => {
        const timestamp = Object.assign(newTimestamp(), {
            recordTime: moment().toISOString() // avoid filtering
        });
        await insert(db, [timestamp]);

        const foundTimestamp = await TimestampsDb.findByImo(db, timestamp.ship.imo!! - 1);
        expect(foundTimestamp.length).toBe(0);
    });

    test('findByLocode - not found', async () => {
        const timestamp = Object.assign(newTimestamp(), {
            recordTime: moment().toISOString() // avoid filtering
        });
        await insert(db, [timestamp]);

        const foundTimestamp = await TimestampsDb.findByLocode(db, timestamp.location.port + 'asdf');
        expect(foundTimestamp.length).toBe(0);
    });

    /*
        NEWEST RECORD
     */
    test('findByMmsi - multiple - only newest', async () => {
        const timestamp = newTimestamp();
        const timestamp2Date = new Date();
        timestamp2Date.setMilliseconds(0);
        const timestamp2 = {
            ...timestamp,
            eventTime: moment(timestamp2Date).add(5, 'hour').toISOString(),
            recordTime: moment(timestamp2Date).add(5, 'hour').toISOString()
        };
        await insert(db, [timestamp, timestamp2]);

        const foundTimestamp = await TimestampsDb.findByMmsi(db, timestamp.ship.mmsi!!);

        expect(foundTimestamp.length).toBe(1);
        expect(moment(foundTimestamp[0].record_time).toISOString()).toBe(timestamp2.recordTime);
    });

    test('findByImo - multiple - only newest', async () => {
        const timestamp = newTimestamp();
        const timestamp2Date = new Date();
        timestamp2Date.setMilliseconds(0);
        const timestamp2 = {
            ...timestamp,
            eventTime: moment(timestamp2Date).add(5, 'hour').toISOString(),
            recordTime: moment(timestamp2Date).add(5, 'hour').toISOString()
        };
        await insert(db, [timestamp, timestamp2]);

        const foundTimestamp = await TimestampsDb.findByImo(db, timestamp.ship.imo!!);

        expect(foundTimestamp.length).toBe(1);
        expect(moment(foundTimestamp[0].record_time).toISOString()).toBe(timestamp2.recordTime);
    });

    test('findByLocode - multiple - only newest', async () => {
        const timestamp = newTimestamp();
        const timestamp2Date = new Date();
        timestamp2Date.setMilliseconds(0);
        const timestamp2 = {
            ...timestamp,
            eventTime: moment(timestamp2Date).add(5, 'hour').toISOString(),
            recordTime: moment(timestamp2Date).add(5, 'hour').toISOString()
        };
        await insert(db, [timestamp, timestamp2]);

        const foundTimestamp = await TimestampsDb.findByLocode(db, timestamp.location.port);

        expect(foundTimestamp.length).toBe(1);
        expect(moment(foundTimestamp[0].record_time).toISOString()).toBe(timestamp2.recordTime);
    });

    /*
        DATE FILTERING
     */
    test('findByMmsi - too old', async () => {
        const timestamp = Object.assign(newTimestamp(), {
            eventTime: moment().subtract('13', 'days').toISOString() // enable filtering
        });
        await insert(db, [timestamp]);

        const foundTimestamp = await TimestampsDb.findByMmsi(db, timestamp.ship.mmsi!!);
        expect(foundTimestamp.length).toBe(0);
    });

    test('findByImo - too old', async () => {
        const timestamp = Object.assign(newTimestamp(), {
            eventTime: moment().subtract('13', 'days').toISOString() // enable filtering
        });
        await insert(db, [timestamp]);

        const foundTimestamp = await TimestampsDb.findByImo(db, timestamp.ship.imo!!);
        expect(foundTimestamp.length).toBe(0);
    });

    test('findByLocode - too old', async () => {
        const timestamp = Object.assign(newTimestamp(), {
            eventTime: moment().subtract('13', 'days').toISOString() // enable filtering
        });
        await insert(db, [timestamp]);

        const foundTimestamp = await TimestampsDb.findByLocode(db, timestamp.location.port);
        expect(foundTimestamp.length).toBe(0);
    });

    test('findByMmsi - too far in the future', async () => {
        const timestamp = Object.assign(newTimestamp(), {
            eventTime: moment().add('4', 'days').toISOString() // enable filtering
        });
        await insert(db, [timestamp]);

        const foundTimestamp = await TimestampsDb.findByMmsi(db, timestamp.ship.mmsi!!);
        expect(foundTimestamp.length).toBe(0);
    });

    test('findByImo - too far in the future', async () => {
        const timestamp = Object.assign(newTimestamp(), {
            eventTime: moment().add('4', 'days').toISOString() // enable filtering
        });
        await insert(db, [timestamp]);

        const foundTimestamp = await TimestampsDb.findByImo(db, timestamp.ship.imo!!);
        expect(foundTimestamp.length).toBe(0);
    });

    test('findByLocode - too far in the future', async () => {
        const timestamp = Object.assign(newTimestamp(), {
            eventTime: moment().add('4', 'days').toISOString() // enable filtering
        });
        await insert(db, [timestamp]);

        const foundTimestamp = await TimestampsDb.findByLocode(db, timestamp.location.port);
        expect(foundTimestamp.length).toBe(0);
    });

    /*
        MULTIPLE SOURCES
     */
    test('findByMmsi - two sources', async () => {
        const mmsi = 123;
        const timestampSource1 = Object.assign(newTimestamp({mmsi}), {
            source: 'source1'
        });
        const timestampSource2 = Object.assign(newTimestamp({mmsi}), {
            source: 'source2'
        });
        await insert(db, [timestampSource1, timestampSource2]);

        const foundTimestamp = await TimestampsDb.findByMmsi(db, mmsi);
        expect(foundTimestamp.length).toBe(2);
    });

    test('findByImo - two sources', async () => {
        const imo = 456;
        const timestampSource1 = Object.assign(newTimestamp({imo}), {
            source: 'source1'
        });
        const timestampSource2 = Object.assign(newTimestamp({imo}), {
            source: 'source2'
        });
        await insert(db, [timestampSource1, timestampSource2]);

        const foundTimestamp = await TimestampsDb.findByImo(db, imo);
        expect(foundTimestamp.length).toBe(2);
    });

    test('findByLocode - two sources', async () => {
        const locode = 'AA111';
        const timestampSource1 = Object.assign(newTimestamp({locode}), {
            source: 'source1'
        });
        const timestampSource2 = Object.assign(newTimestamp({locode}), {
            source: 'source2'
        });
        await insert(db, [timestampSource1, timestampSource2]);

        const foundTimestamp = await TimestampsDb.findByLocode(db, locode);
        expect(foundTimestamp.length).toBe(2);
    });

    /*
        FIND ETA SHIPS
    */
    test('findPortnetETAsByLocodes - 1 h in future is found', async () => {
        const locode = 'AA123';
        const eventTime = moment().add(1, 'hours').toDate();
        const timestamp = newTimestamp({eventType: EventType.ETA, locode, eventTime, source: 'Portnet'});
        await insert(db, [timestamp]);
        await createPortcall(timestamp);

        const foundTimestamps = await TimestampsDb.findPortnetETAsByLocodes(db, [locode]);

        expect(foundTimestamps.length).toBe(1);
        expect(foundTimestamps[0]).toMatchObject({
            locode,
            imo: timestamp.ship.imo
        });
    });

    test('findPortnetETAsByLocodes - ETD not found', async () => {
        const locode = 'AA123';
        const eventTime = moment().add(1, 'hours').toDate();
        const timestamp = newTimestamp({eventType: EventType.ETD, locode, eventTime, source: 'Portnet'});
        await insert(db, [timestamp]);
        await createPortcall(timestamp);

        const foundTimestamps = await TimestampsDb.findPortnetETAsByLocodes(db, [locode]);

        expect(foundTimestamps.length).toBe(0);
    });

    test('findPortnetETAsByLocodes - non-matching locode not found', async () => {
        const locode = 'AA123';
        const eventTime = moment().add(1, 'hours').toDate();
        const timestamp = newTimestamp({eventType: EventType.ETA, locode: 'BB456', eventTime, source: 'Portnet'});
        await insert(db, [timestamp]);
        await createPortcall(timestamp);

        const foundTimestamps = await TimestampsDb.findPortnetETAsByLocodes(db, [locode]);

        expect(foundTimestamps.length).toBe(0);
    });

    test('findPortnetETAsByLocodes - only Portnet is found', async () => {
        const locode = 'AA123';
        const eventTime = moment().add(1, 'hours').toDate();
        const timestamp1 = newTimestamp({eventType: EventType.ETA, locode, eventTime, source: 'Portnet'});
        const timestamp2 = newTimestamp({eventType: EventType.ETA, locode, eventTime, source: 'S1'});
        const timestamp3 = newTimestamp({eventType: EventType.ETA, locode, eventTime, source: 'S2'});
        const timestamp4 = newTimestamp({eventType: EventType.ETA, locode, eventTime, source: 'S3'});
        await insert(db, [timestamp1, timestamp2, timestamp3, timestamp4]);
        await createPortcall(timestamp1);
        await createPortcall(timestamp2);
        await createPortcall(timestamp3);
        await createPortcall(timestamp4);

        const foundTimestamps = await TimestampsDb.findPortnetETAsByLocodes(db, [locode]);

        expect(foundTimestamps.length).toBe(1);
    });

    test('findPortnetETAsByLocodes - multiple locodes', async () => {
        const locode1 = 'AA123';
        const locode2 = 'BB456';
        const eventTime = moment().add(1, 'hours').toDate();

        const timestamp1 = newTimestamp({eventType: EventType.ETA, locode: locode1, eventTime, source: 'Portnet'});
        const timestamp2 = newTimestamp({eventType: EventType.ETA, locode: locode2, eventTime, source: 'Portnet'});
        await insert(db, [timestamp1, timestamp2]);
        await createPortcall(timestamp1);
        await createPortcall(timestamp2);

        const foundTimestamps = await TimestampsDb.findPortnetETAsByLocodes(db, [locode1, locode2]);

        expect(foundTimestamps.length).toBe(2);
    });

    test('findVtsShipImosTooCloseToPortByPortCallId - returns ships closer than specified', async () => {
        const shipApproachThresholdMinutes = 15;
        const eventTime = moment().add(shipApproachThresholdMinutes-1, 'minutes').toDate();
        const ts = newTimestamp({
            portcallId: 1,
            eventType: EventType.ETA,
            source: EVENTSOURCE_VTS,
            eventTime
        });
        await insert(db, [ts]);

        const ships = await TimestampsDb.findVtsShipImosTooCloseToPortByPortCallId(db, [ts.portcallId!], [{
            locode: ts.location.port,
            default: null,
            areas: [{
                longitude: 0,
                latitude: 0,
                portAreaCode: ts.location.portArea,
                shipApproachThresholdMinutes
            }]
        }]);

        expect(ships.length).toBe(1);
    });

    test("findVtsShipImosTooCloseToPortByPortCallId - doesn't return ships further than specified", async () => {
        const shipApproachThresholdMinutes = 15;
        const eventTime = moment().add(shipApproachThresholdMinutes+1, 'minutes').toDate();
        const ts = newTimestamp({
            portcallId: 1,
            eventType: EventType.ETA,
            source: EVENTSOURCE_VTS,
            eventTime
        });
        await insert(db, [ts]);

        const ships = await TimestampsDb.findVtsShipImosTooCloseToPortByPortCallId(db, [ts.portcallId!], [{
            locode: ts.location.port,
            default: null,
            areas: [{
                longitude: 0,
                latitude: 0,
                portAreaCode: ts.location.portArea,
                shipApproachThresholdMinutes
            }]
        }]);

        expect(ships.length).toBe(0);
    });

    async function createPortcall(timestamp: ApiTimestamp) {
        return db.tx(t => {
            insertPortCall(t, newPortCall(timestamp));
            insertPortAreaDetails(t, newPortAreaDetails(timestamp));
        });
    }

    function createTimestampToRemove(vessel_imo: number, start_code: string, pilotage_end_time: Date): any {
        return {
            vessel_imo,
            start_code,
            pilotage_end_time
        }
    }
}));
