import moment from 'moment';
import * as pgPromise from "pg-promise";
import {dbTestBase, findAll, insert} from "../db-testutil";
import {newEstimate} from "../testdata";
import {findByImo, findByLocode, findByMmsi, ShipIdType, updateEstimates} from "../../../lib/db/db-estimates";

describe('db-estimates - updates', dbTestBase((db: pgPromise.IDatabase<any, any>) => {
    test('updateEstimates - properties', async () => {
        const estimate = newEstimate({
            eventTimeConfidenceLower: 'PT1H',
            eventTimeConfidenceUpper: 'PT4H'
        });

        await Promise.all(updateEstimates(db, [estimate]));

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

    test('updateEstimates - mmsi over imo', async () => {
        const estimate = Object.assign(newEstimate(), {
            ship: {
                mmsi: 123,
                imo: undefined
            }
        });

        await Promise.all(updateEstimates(db, [estimate]));

        const e = (await findAll(db))[0];
        expect(e.ship_id).toBe(estimate.ship.mmsi);
        expect(e.ship_id_type).toBe(ShipIdType.MMSI);
    });

    test('updateEstimates - just imo', async () => {
        const estimate = Object.assign(newEstimate(), {
            ship: {
                mmsi: undefined,
                imo: 456
            }
        });

        await Promise.all(updateEstimates(db, [estimate]));

        const e = (await findAll(db))[0];
        expect(e.ship_id).toBe(estimate.ship.imo);
        expect(e.ship_id_type).toBe(ShipIdType.IMO);
    });

    test('updateEstimates - both ids', async () => {
        const estimate = Object.assign(newEstimate(), {
            ship: {
                mmsi: 123,
                imo: 456
            }
        });

        await Promise.all(updateEstimates(db, [estimate]));

        const e = (await findAll(db))[0];
        expect(e.ship_id).toBe(estimate.ship.mmsi);
        expect(e.ship_id_type).toBe(ShipIdType.MMSI);
        expect(e.secondary_ship_id).toBe(estimate.ship.imo);
        expect(e.secondary_ship_id_type).toBe(ShipIdType.IMO);
    });

    test('updateEstimates - ignore duplicate', async () => {
        const estimate = newEstimate();

        await Promise.all(updateEstimates(db, [estimate]));
        await Promise.all(updateEstimates(db, [estimate]));

        expect((await findAll(db)).length).toBe(1);
    });

}));
