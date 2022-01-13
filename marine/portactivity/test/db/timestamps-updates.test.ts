import moment from 'moment';
import {dbTestBase, findAll, insertPortAreaDetails, insertPortCall} from "../db-testutil";
import {newTimestamp, newPortAreaDetails, newPortCall, PortAreaDetails, PortCall} from "../testdata";
import * as TimestampsDb from "../../lib/db/timestamps";
import {ApiTimestamp, EventType} from "../../lib/model/timestamp";
import {DTDatabase} from "digitraffic-common/database/database";

describe('db-timestamps - updates', dbTestBase((db: DTDatabase) => {

    test('updateTimestamp - properties', async () => {
        const timestamp = newTimestamp({
            eventTimeConfidenceLower: 'PT1H',
            eventTimeConfidenceUpper: 'PT4H',
        });

        await TimestampsDb.updateTimestamp(db, timestamp);

        const fetchedTimestamps = await findAll(db);
        expect(fetchedTimestamps.length).toBe(1);
        const e = fetchedTimestamps[0];
        expect(e.location_locode).toBe(timestamp.location.port);
        expect(e.location_portarea).toBe(timestamp.location.portArea);
        expect(e.location_from_locode).toBe(timestamp.location.from);
        expect(e.event_source).toBe(timestamp.source);
        expect(moment(e.record_time).toISOString()).toBe(timestamp.recordTime);
        expect(moment(e.event_time).toISOString()).toBe(timestamp.eventTime);
        expect(e.event_type).toBe(timestamp.eventType);
        expect(e.event_time_confidence_lower).toBe(timestamp.eventTimeConfidenceLower);
        expect(e.event_time_confidence_lower_diff).toBe(moment(timestamp.eventTime).valueOf() - moment(timestamp.eventTime).subtract(moment.duration(timestamp.eventTimeConfidenceLower)).valueOf());
        expect(e.event_time_confidence_upper).toBe(timestamp.eventTimeConfidenceUpper);
        expect(e.event_time_confidence_upper_diff).toBe(moment(timestamp.eventTime).add(moment.duration(timestamp.eventTimeConfidenceUpper)).valueOf() - moment(timestamp.eventTime).valueOf());
    });

    test('updateTimestamp - mmsi', async () => {
        const timestamp = Object.assign(newTimestamp(), {
            ship: {
                mmsi: 123,
                imo: undefined,
            },
        });

        await expect(() => TimestampsDb.updateTimestamp(db, timestamp)).rejects.toThrow();
    });

    test('updateTimestamp - imo', async () => {
        const timestamp = Object.assign(newTimestamp(), {
            ship: {
                mmsi: undefined,
                imo: 456,
            },
        });

        await expect(() => TimestampsDb.updateTimestamp(db, timestamp)).rejects.toThrow();
    });

    test('updateTimestamp - both ids', async () => {
        const timestamp = Object.assign(newTimestamp(), {
            ship: {
                mmsi: 123,
                imo: 456,
            },
        });

        await TimestampsDb.updateTimestamp(db, timestamp);

        const e = (await findAll(db))[0];
        expect(e.ship_mmsi).toBe(timestamp.ship.mmsi);
        expect(e.ship_imo).toBe(timestamp.ship.imo);
    });

    test('updateTimestamp - ignore duplicate', async () => {
        const timestamp = newTimestamp();

        await TimestampsDb.updateTimestamp(db, timestamp);
        await TimestampsDb.updateTimestamp(db, timestamp);

        expect((await findAll(db)).length).toBe(1);
    });

    test('createUpdateValues - mmsi 0', () => {
        const imo = 123456789;
        const values = TimestampsDb.createUpdateValues(newTimestamp({
            mmsi: 0,
            imo,
        }));

        expect(values[9]).toBe(undefined);
        expect(values[10]).toBe(imo);
    });

    test('createUpdateValues - imo 0', () => {
        const mmsi = 123456789;
        const values = TimestampsDb.createUpdateValues(newTimestamp({
            mmsi,
            imo: 0,
        }));

        expect(values[9]).toBe(mmsi);
        expect(values[10]).toBe(undefined);
    });

    test('portcall id - supplied', async () => {
        const portcallId = 123;
        const timestamp = newTimestamp({
            portcallId,
        });

        await TimestampsDb.updateTimestamp(db, timestamp);

        expect((await findAll(db))[0].portcall_id).toBe(portcallId);
    });

    test('findPortcallId - by nearest time', async () => {
        const eventTime = moment();
        const timestamp = newTimestamp({
            eventType: EventType.ETA,
            eventTime: eventTime.toDate(),
        });
        const portAreaDetails = await generatePortCalls(timestamp);
        const nearestTimestamp = // sort by nearest time
            portAreaDetails.sort((a, b) => {
                const aDiff = Math.abs(moment(a.eta).diff(eventTime));
                const bDiff = Math.abs(moment(b.eta).diff(eventTime));
                return aDiff - bDiff;
            })[0];

        const portcallId = await TimestampsDb.findPortcallId(
            db,
            timestamp.location.port,
            timestamp.eventType,
            moment(timestamp.eventTime).toDate(),
            timestamp.ship.mmsi,
            timestamp.ship.imo,
        );

        expect(portcallId).toBe(nearestTimestamp.port_call_id);
    });

    test('findPortcallId - not found', async () => {
        const eventTime = moment();
        const timestamp = newTimestamp({
            eventType: EventType.ETA,
            eventTime: eventTime.toDate(),
        });
        await generatePortCalls(timestamp);

        const portcallId = await TimestampsDb.findPortcallId(
            db,
            'NOT_FOUND',
            timestamp.eventType,
            moment(timestamp.eventTime).toDate(),
            123,
            456,
        );

        expect(portcallId).toBeNull();
    });

    async function generatePortCalls(timestamp: ApiTimestamp): Promise<PortAreaDetails[]> {
        // cumbersome way to generate a number range
        const portCallData = [...new Set([...Array(5 + Math.floor(Math.random() * 10)).keys()])].map((i) => {
            const portcallId = i + 1;
            const pc = newPortCall(timestamp, portcallId);
            const pac = newPortAreaDetails(timestamp, {
                portcallId: portcallId,
                eta: moment(timestamp.eventTime).add(1 + Math.floor(Math.random() * 100), 'minutes').toDate(),
            });
            return [pc, pac];
        });
        const portCalls = portCallData.map(p => p[0]) as PortCall[];
        const portAreaDetails = portCallData.map(p => p[1]) as PortAreaDetails[];
        await db.tx(t => {
            for (const pc of portCalls) {
                insertPortCall(t, pc);
            }
            for (const pad of portAreaDetails) {
                insertPortAreaDetails(t, pad);
            }
        });
        return portAreaDetails;
    }

}));
