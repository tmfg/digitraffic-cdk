import moment from 'moment';
import * as pgPromise from "pg-promise";
import {dbTestBase, findAll, insertPortAreaDetails, insertPortCall} from "../../db-testutil";
import {newEstimate, newPortAreaDetails, newPortCall, PortAreaDetails, PortCall} from "../../testdata";
import {createUpdateValues, updateEstimate} from "../../../../lib/estimates/db/db-estimates";
import {ApiEstimate, EventType} from "../../../../lib/estimates/model/estimate";

describe('db-estimates - updates', dbTestBase((db: pgPromise.IDatabase<any, any>) => {
    test('updateEstimate - properties', async () => {
        const estimate = newEstimate({
            eventTimeConfidenceLower: 'PT1H',
            eventTimeConfidenceUpper: 'PT4H'
        });

        await updateEstimate(db, estimate);

        const fetchedEstimates = await findAll(db);
        expect(fetchedEstimates.length).toBe(1);
        const e = fetchedEstimates[0];
        expect(e.location_locode).toBe(estimate.location.port);
        expect(e.event_source).toBe(estimate.source);
        expect(moment(e.record_time).toISOString()).toBe(estimate.recordTime);
        expect(moment(e.event_time).toISOString()).toBe(estimate.eventTime);
        expect(e.event_type).toBe(estimate.eventType);
        expect(e.event_time_confidence_lower).toBe(estimate.eventTimeConfidenceLower);
        expect(e.event_time_confidence_lower_diff).toBe(moment(estimate.eventTime).valueOf() - moment(estimate.eventTime).subtract(moment.duration(estimate.eventTimeConfidenceLower)).valueOf());
        expect(e.event_time_confidence_upper).toBe(estimate.eventTimeConfidenceUpper);
        expect(e.event_time_confidence_upper_diff).toBe(moment(estimate.eventTime).add(moment.duration(estimate.eventTimeConfidenceUpper)).valueOf() - moment(estimate.eventTime).valueOf());
    });

    test('updateEstimate - mmsi', async () => {
        const estimate = Object.assign(newEstimate(), {
            ship: {
                mmsi: 123,
                imo: undefined
            }
        });

        await expect(() => updateEstimate(db, estimate)).rejects.toThrow();
    });

    test('updateEstimate - imo', async () => {
        const estimate = Object.assign(newEstimate(), {
            ship: {
                mmsi: undefined,
                imo: 456
            }
        });

        await expect(() => updateEstimate(db, estimate)).rejects.toThrow();
    });

    test('updateEstimate - both ids', async () => {
        const estimate = Object.assign(newEstimate(), {
            ship: {
                mmsi: 123,
                imo: 456
            }
        });

        await updateEstimate(db, estimate);

        const e = (await findAll(db))[0];
        expect(e.ship_mmsi).toBe(estimate.ship.mmsi);
        expect(e.ship_imo).toBe(estimate.ship.imo);
    });

    test('updateEstimate - ignore duplicate', async () => {
        const estimate = newEstimate();

        await updateEstimate(db, estimate);
        await updateEstimate(db, estimate);

        expect((await findAll(db)).length).toBe(1);
    });

    test('createUpdateValues - mmsi 0', () => {
        const imo = 123456789;
         const values = createUpdateValues(newEstimate({
             mmsi: 0,
             imo
         }));

        expect(values[9]).toBe(undefined);
        expect(values[10]).toBe(imo);
    });

    test('createUpdateValues - imo 0', () => {
        const mmsi = 123456789;
        const values = createUpdateValues(newEstimate({
            mmsi,
            imo: 0
        }));

        expect(values[9]).toBe(mmsi);
        expect(values[10]).toBe(undefined);
    });

    test('portcall id - supplied', async () => {
        const portcallId = 123;
        const estimate = newEstimate({
            portcallId
        });

        await updateEstimate(db, estimate);

        expect((await findAll(db))[0].portcall_id).toBe(portcallId);
    });

    test('portcall id - deduced by nearest time', async () => {
        const eventTime = moment();
        const estimate = newEstimate({
            eventType: EventType.ETA,
            eventTime: eventTime.toDate()
        });
        // @ts-ignore
        estimate.portcallId = null; // set to null to trigger automatic guessing of portcallid
        const portAreaDetails = await generatePortCalls(estimate);
        const nearestEstimate = // sort by nearest time
            portAreaDetails.sort((a, b) => {
                const aDiff = Math.abs(moment(a.eta).diff(eventTime));
                const bDiff = Math.abs(moment(b.eta).diff(eventTime));
                return aDiff - bDiff;
            })[0];

        await updateEstimate(db, estimate);

        expect((await findAll(db))[0].portcall_id).toBe(nearestEstimate.port_call_id);
    });

    async function generatePortCalls(estimate: ApiEstimate): Promise<PortAreaDetails[]> {
        // cumbersome way to generate a number range
        const portCallData = [...new Set([...Array(5 + Math.floor(Math.random() * 10)).keys()])].map((i) => {
            const portcallId = i + 1;
            const pc = newPortCall(estimate, portcallId);
            const pac = newPortAreaDetails(estimate, {
                portcallId: portcallId,
                eta: moment(estimate.eventTime).add(1 + Math.floor(Math.random() * 100), 'minutes').toDate()
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
