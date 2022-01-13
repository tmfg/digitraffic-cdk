import moment from 'moment';
import {dbTestBase, insert, insertPortAreaDetails, insertPortCall, insertVessel} from "../db-testutil";
import {newPortAreaDetails, newPortCall, newTimestamp, newVessel} from "../testdata";
import * as TimestampsDb from "../../lib/db/timestamps";
import {ApiTimestamp, EventType} from "../../lib/model/timestamp";
import {EventSource} from "../../lib/model/eventsource";
import {DbTimestamp} from "../../lib/db/timestamps";
import {DTDatabase} from "digitraffic-common/database/database";

const EVENT_SOURCE = 'TEST';

describe('db-timestamps', dbTestBase((db: DTDatabase) => {

    test('removeTimestamps - empty', async () => {
        const removed = await TimestampsDb.removeTimestamps(db, EVENT_SOURCE, []);

        expect(removed).toHaveLength(0);
    });

    test('removeTimestamps - not found', async () => {
        const removed = await TimestampsDb.removeTimestamps(db, EVENT_SOURCE, ["123"]);

        expect(removed).toHaveLength(0);
    });

    test('removeTimestamps - found 1', async () => {
        const imo = 123;
        const locode = 'FITST';
        const eventTime = new Date();
        const source = EVENT_SOURCE;
        const sourceId = "1";

        await insert(db, [newTimestamp({ imo, locode, eventTime, source, sourceId }), newTimestamp()]);

        // wrong id
        const notRemoved = await TimestampsDb.removeTimestamps(db, EVENT_SOURCE, ["2"]);
        expect(notRemoved).toHaveLength(0);

        // wrong source
        const notRemoved2 = await TimestampsDb.removeTimestamps(db, 'WRONG_SOURCE', ["1"]);
        expect(notRemoved2).toHaveLength(0);

        // correct id and source
        const removed = await TimestampsDb.removeTimestamps(db, EVENT_SOURCE, ["1"]);
        expect(removed).toHaveLength(1);
    });

    function testFound(description: string, fn: (db: DTDatabase, timestamp: ApiTimestamp) => Promise<DbTimestamp[]>) {
        test(`${description} - found`, async () => {
            const timestamp = Object.assign(newTimestamp(), {
                recordTime: moment().toISOString(), // avoid filtering
            });
            await insert(db, [timestamp]);

            const foundTimestamp = await fn(db, timestamp);
            expect(foundTimestamp.length).toBe(1);
        });
    }

    function testFoundInFuture(description: string, fn: (db: DTDatabase, timestamp: ApiTimestamp) => Promise<DbTimestamp[]>) {
        test(`${description} - found 71 h in the future`, async () => {
            const timestamp = Object.assign(newTimestamp(), {
                recordTime: moment().toISOString(), // avoid filtering,
                eventTime: moment().add(71, 'hours'),
            });
            await insert(db, [timestamp]);

            const foundTimestamp = await fn(db, timestamp);
            expect(foundTimestamp.length).toBe(1);
        });
    }

    testFound('findByMmsi', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findByMmsi(db, timestamp.ship.mmsi as number));
    testFound('findByImo', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findByImo(db, timestamp.ship.imo as number));
    testFound('findByLocode', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findByLocode(db, timestamp.location.port));
    testFound('findBySource', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findBySource(db, timestamp.source));

    testFoundInFuture('findByMmsi', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findByMmsi(db, timestamp.ship.mmsi as number));
    testFoundInFuture('findByImo', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findByImo(db, timestamp.ship.imo as number));
    testFoundInFuture('findByLocode', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findByLocode(db, timestamp.location.port));
    testFoundInFuture('findBySource', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findBySource(db, timestamp.source));

    function testNotFound(description: string, fn: (db: DTDatabase, timestamp: ApiTimestamp) => Promise<DbTimestamp[]>) {
        test(`${description} - not found`, async () => {
            const timestamp = Object.assign(newTimestamp(), {
                recordTime: moment().toISOString(), // avoid filtering
            });
            await insert(db, [timestamp]);

            const foundTimestamp = await fn(db, timestamp);
            expect(foundTimestamp.length).toBe(0);
        });
    }

    testNotFound('findByMmsi', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findByMmsi(db, timestamp.ship.mmsi as number + 1));
    testNotFound('findByImo', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findByImo(db, timestamp.ship.imo as number - 1));
    testNotFound('findByLocode', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findByLocode(db, timestamp.location.port + 'asdf'));
    testNotFound('findBySource', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findByLocode(db, timestamp.source + 'asdf'));


    function testNewest(description: string, fn: (db: DTDatabase, timestamp: ApiTimestamp) => Promise<DbTimestamp[]>) {
        test(`${description} - multiple - only newest`, async () => {
            const timestamp = newTimestamp();
            const timestamp2Date = new Date();
            timestamp2Date.setMilliseconds(0);
            const timestamp2 = {
                ...timestamp,
                eventTime: moment(timestamp2Date).add(5, 'hour').toISOString(),
                recordTime: moment(timestamp2Date).add(5, 'hour').toISOString(),
            };
            await insert(db, [timestamp, timestamp2]);

            const foundTimestamp = await fn(db, timestamp);

            expect(foundTimestamp.length).toBe(1);
            expect(moment(foundTimestamp[0].record_time).toISOString()).toBe(timestamp2.recordTime);
        });
    }

    testNewest('findByMmsi', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findByMmsi(db, timestamp.ship.mmsi as number));
    testNewest('findByImo', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findByImo(db, timestamp.ship.imo as number));
    testNewest('findByLocode', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findByLocode(db, timestamp.location.port));
    testNewest('findBySource', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findBySource(db, timestamp.source));

    function testTooOld(description: string, fn: (db: DTDatabase, timestamp: ApiTimestamp) => Promise<DbTimestamp[]>) {
        test(`${description} - too old`, async () => {
            const timestamp = Object.assign(newTimestamp(), {
                eventTime: moment().subtract('13', 'days').toISOString(), // enable filtering
            });
            await insert(db, [timestamp]);

            const foundTimestamp = await fn(db, timestamp);
            expect(foundTimestamp.length).toBe(0);
        });
    }

    testTooOld('findByMmsi', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findByMmsi(db, timestamp.ship.mmsi as number));
    testTooOld('findByImo', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findByImo(db, timestamp.ship.imo as number));
    testTooOld('findByLocode', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findByLocode(db, timestamp.location.port));
    testTooOld('findBySource', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findBySource(db, timestamp.source));

    function testTooFarInTheFuture(description: string, fn: (db: DTDatabase, timestamp: ApiTimestamp) => Promise<DbTimestamp[]>) {
        test(`${description} - too far in the future`, async () => {
            const timestamp = Object.assign(newTimestamp(), {
                eventTime: moment().add('4', 'days').toISOString(), // enable filtering
            });
            await insert(db, [timestamp]);

            const foundTimestamp = await fn(db, timestamp);
            expect(foundTimestamp.length).toBe(0);
        });
    }

    testTooFarInTheFuture('findByMmsi', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findByMmsi(db, timestamp.ship.mmsi as number));
    testTooFarInTheFuture('findByImo', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findByImo(db, timestamp.ship.imo as number));
    testTooFarInTheFuture('findByLocode', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findByLocode(db, timestamp.location.port));
    testTooFarInTheFuture('findBySource', (db: DTDatabase, timestamp: ApiTimestamp) => TimestampsDb.findBySource(db, timestamp.source));

    test('findByMmsi - two sources', async () => {
        const mmsi = 123;
        const timestampSource1 = Object.assign(newTimestamp({mmsi}), {
            source: 'source1',
        });
        const timestampSource2 = Object.assign(newTimestamp({mmsi}), {
            source: 'source2',
        });
        await insert(db, [timestampSource1, timestampSource2]);

        const foundTimestamp = await TimestampsDb.findByMmsi(db, mmsi);
        expect(foundTimestamp.length).toBe(2);
    });

    test('findByImo - two sources', async () => {
        const imo = 456;
        const timestampSource1 = Object.assign(newTimestamp({imo}), {
            source: 'source1',
        });
        const timestampSource2 = Object.assign(newTimestamp({imo}), {
            source: 'source2',
        });
        await insert(db, [timestampSource1, timestampSource2]);

        const foundTimestamp = await TimestampsDb.findByImo(db, imo);
        expect(foundTimestamp.length).toBe(2);
    });

    test('findByLocode - two sources', async () => {
        const locode = 'AA111';
        const timestampSource1 = Object.assign(newTimestamp({locode}), {
            source: 'source1',
        });
        const timestampSource2 = Object.assign(newTimestamp({locode}), {
            source: 'source2',
        });
        await insert(db, [timestampSource1, timestampSource2]);

        const foundTimestamp = await TimestampsDb.findByLocode(db, locode);
        expect(foundTimestamp.length).toBe(2);
    });

    test('findByLocode - from not used when timestamp is not Pilotweb', async () => {
        const locode = 'AA123';
        const from = 'BB456';
        const timestamp = Object.assign(newTimestamp({ locode, from, source: EventSource.PORTNET }), {
            recordTime: moment().toISOString(), // avoid filtering
        });
        await insert(db, [timestamp]);

        const foundTimestamp = await TimestampsDb.findByLocode(db, from);
        expect(foundTimestamp.length).toBe(0);
    });

    test('findByLocode - from is used when timestamp is Pilotweb', async () => {
        const locode = 'AA123';
        const from = 'BB456';
        const timestamp = Object.assign(newTimestamp({ locode, from, source: EventSource.PILOTWEB }), {
            recordTime: moment().toISOString(), // avoid filtering
        });
        await insert(db, [timestamp]);

        const foundTimestamp = await TimestampsDb.findByLocode(db, from);
        expect(foundTimestamp.length).toBe(1);
    });

    test('findPortnetETAsByLocodes - 23 h in future is found', async () => {
        const locode = 'AA123';
        const eventTime = moment().add(23, 'hours').toDate();
        const timestamp = newTimestamp({eventType: EventType.ETA, locode, eventTime, source: 'Portnet'});
        await insert(db, [timestamp]);
        await createPortcall(timestamp);

        const foundTimestamps = await TimestampsDb.findPortnetETAsByLocodes(db, [locode]);

        expect(foundTimestamps.length).toBe(1);
        expect(foundTimestamps[0]).toMatchObject({
            locode,
            imo: timestamp.ship.imo,
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
            source: EventSource.AWAKE_AI,
            eventTime,
        });
        await insert(db, [ts]);

        const ships = await TimestampsDb.findVtsShipImosTooCloseToPortByPortCallId(db, [ts.portcallId as number]);

        expect(ships.length).toBe(1);
    });

    test("findVtsShipImosTooCloseToPortByPortCallId - doesn't return ships further than specified", async () => {
        const shipApproachThresholdMinutes = 15;
        const eventTime = moment().add(shipApproachThresholdMinutes+1, 'minutes').toDate();
        const ts = newTimestamp({
            portcallId: 1,
            eventType: EventType.ETA,
            source: EventSource.AWAKE_AI,
            eventTime,
        });
        await insert(db, [ts]);

        const ships = await TimestampsDb.findVtsShipImosTooCloseToPortByPortCallId(db, [ts.portcallId as number]);

        expect(ships.length).toBe(0);
    });

    test('findMmsiByImo - not found', async () => {
        const mmsi = await TimestampsDb.findMmsiByImo(db, 0);

        expect(mmsi).toBeNull();
    });

    test('findMmsiByImo - found with AIS', async () => {
        const timestamp = newTimestamp({imo: 1, mmsi: 2});
        const vessel = newVessel(timestamp);
        await insertVessel(db, vessel);

        const mmsi = await db.tx(t => TimestampsDb.findMmsiByImo(t, vessel.imo));

        expect(mmsi).toEqual(vessel.mmsi);
    });

    test('findMmsiByImo - found with portcall', async () => {
        const timestamp = newTimestamp({imo: 1, mmsi: 2});
        await createPortcall(timestamp);

        const mmsi = await db.tx(t => TimestampsDb.findMmsiByImo(t, timestamp.ship.imo as number));

        expect(mmsi).toEqual(timestamp.ship.mmsi);
    });

    test('findImoByMmsi - not found', async () => {
        const imo = await TimestampsDb.findImoByMmsi(db, 0);

        expect(imo).toBeNull();
    });

    test('findImoByMmsi - found with AIS', async () => {
        const timestamp = newTimestamp({imo: 1, mmsi: 2});
        const vessel = newVessel(timestamp);
        await insertVessel(db, vessel);

        const imo = await db.tx(t => TimestampsDb.findImoByMmsi(t, vessel.mmsi));

        expect(imo).toEqual(vessel.imo);
    });

    test('findImoByMmsi - found with portcall', async () => {
        const timestamp = newTimestamp({imo: 1, mmsi: 2});
        await createPortcall(timestamp);

        const imo = await db.tx(t => TimestampsDb.findImoByMmsi(t, timestamp.ship.mmsi as number));

        expect(imo).toEqual(timestamp.ship.imo);
    });

    async function createPortcall(timestamp: ApiTimestamp) {
        return db.tx(t => {
            insertPortCall(t, newPortCall(timestamp));
            insertPortAreaDetails(t, newPortAreaDetails(timestamp));
        });
    }
}));
