import moment from 'moment';
import * as pgPromise from "pg-promise";
import {dbTestBase, findAll, insertPortAreaDetails, insertPortCall} from "../db-testutil";
import {newTimestamp, newPortAreaDetails, newPortCall, PortAreaDetails, PortCall} from "../testdata";
import {createUpdateValues, updateTimestamp} from "../../../lib/db/db-timestamps";
import {ApiTimestamp, EventType} from "../../../lib/model/timestamp";

describe('db-timestamps - updates', dbTestBase((db: pgPromise.IDatabase<any, any>) => {
    test('updateTimestamp - properties', async () => {
        const timestamp = newTimestamp({
            eventTimeConfidenceLower: 'PT1H',
            eventTimeConfidenceUpper: 'PT4H'
        });

        await updateTimestamp(db, timestamp);

        const fetchedTimestamps = await findAll(db);
        expect(fetchedTimestamps.length).toBe(1);
        const e = fetchedTimestamps[0];
        expect(e.location_locode).toBe(timestamp.location.port);
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
                imo: undefined
            }
        });

        await expect(() => updateTimestamp(db, timestamp)).rejects.toThrow();
    });

    test('updateTimestamp - imo', async () => {
        const timestamp = Object.assign(newTimestamp(), {
            ship: {
                mmsi: undefined,
                imo: 456
            }
        });

        await expect(() => updateTimestamp(db, timestamp)).rejects.toThrow();
    });

    test('updateTimestamp - both ids', async () => {
        const timestamp = Object.assign(newTimestamp(), {
            ship: {
                mmsi: 123,
                imo: 456
            }
        });

        await updateTimestamp(db, timestamp);

        const e = (await findAll(db))[0];
        expect(e.ship_mmsi).toBe(timestamp.ship.mmsi);
        expect(e.ship_imo).toBe(timestamp.ship.imo);
    });

    test('updateTimestamp - ignore duplicate', async () => {
        const timestamp = newTimestamp();

        await updateTimestamp(db, timestamp);
        await updateTimestamp(db, timestamp);

        expect((await findAll(db)).length).toBe(1);
    });

    test('createUpdateValues - mmsi 0', () => {
        const imo = 123456789;
         const values = createUpdateValues(newTimestamp({
             mmsi: 0,
             imo
         }));

        expect(values[9]).toBe(undefined);
        expect(values[10]).toBe(imo);
    });

    test('createUpdateValues - imo 0', () => {
        const mmsi = 123456789;
        const values = createUpdateValues(newTimestamp({
            mmsi,
            imo: 0
        }));

        expect(values[9]).toBe(mmsi);
        expect(values[10]).toBe(undefined);
    });

    test('portcall id - supplied', async () => {
        const portcallId = 123;
        const timestamp = newTimestamp({
            portcallId
        });

        await updateTimestamp(db, timestamp);

        expect((await findAll(db))[0].portcall_id).toBe(portcallId);
    });

    test('portcall id - deduced by nearest time', async () => {
        const eventTime = moment();
        const timestamp = newTimestamp({
            eventType: EventType.ETA,
            eventTime: eventTime.toDate()
        });
        // @ts-ignore
        timestamp.portcallId = null; // set to null to trigger automatic guessing of portcallid
        const portAreaDetails = await generatePortCalls(timestamp);
        const nearestTimestamp = // sort by nearest time
            portAreaDetails.sort((a, b) => {
                const aDiff = Math.abs(moment(a.eta).diff(eventTime));
                const bDiff = Math.abs(moment(b.eta).diff(eventTime));
                return aDiff - bDiff;
            })[0];

        await updateTimestamp(db, timestamp);

        expect((await findAll(db))[0].portcall_id).toBe(nearestTimestamp.port_call_id);
    });

    async function generatePortCalls(timestamp: ApiTimestamp): Promise<PortAreaDetails[]> {
        // cumbersome way to generate a number range
        const portCallData = [...new Set([...Array(5 + Math.floor(Math.random() * 10)).keys()])].map((i) => {
            const portcallId = i + 1;
            const pc = newPortCall(timestamp, portcallId);
            const pac = newPortAreaDetails(timestamp, {
                portcallId: portcallId,
                eta: moment(timestamp.eventTime).add(1 + Math.floor(Math.random() * 100), 'minutes').toDate()
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
