import moment from 'moment';
import * as pgPromise from "pg-promise";
import {dbTestBase, findAll, insert} from "../../db-testutil";
import {newEstimate} from "../../testdata";
import {
    createUpdateValues,
    updateEstimate
} from "../../../../lib/estimates/db/db-estimates";

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

    test('portcall id', async () => {
        const portcallId = 123;
        const estimate = newEstimate({
            portcallId
        });

        await updateEstimate(db, estimate);

        expect((await findAll(db))[0].portcall_id).toBe(portcallId);
    });

}));
