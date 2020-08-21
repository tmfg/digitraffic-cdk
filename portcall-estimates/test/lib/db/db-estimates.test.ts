import moment from 'moment';
import * as pgPromise from "pg-promise";
import {dbTestBase, findAll, insert} from "../db-testutil";
import {newEstimate} from "../testdata";
import {findByLocode, ShipIdType, updateEstimates} from "../../../lib/db/db-estimates";
import {ApiEstimate} from "../../../lib/model/estimate";

describe('db-estimates', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('updateEstimates - properties', async () => {
        const estimate = newEstimate();

        await Promise.all(updateEstimates(db, [estimate]));

        const fetchedEstimates = await findAll(db);
        expect(fetchedEstimates.length).toBe(1);
        const e = fetchedEstimates[0];
        expect(e.location_locode).toBe(estimate.location.port);
        expect(e.event_source).toBe(estimate.source);
        expect(moment(e.record_time).toISOString()).toBe(estimate.recordTime);
        expect(moment(e.event_time).toISOString()).toBe(estimate.eventTime);
        expect(e.event_type).toBe(estimate.eventType);
        expect(moment(e.event_time_confidence_lower).toISOString()).toBe(moment(e.event_time).subtract(moment.duration(estimate.eventTimeConfidenceLower)).toISOString());
        expect(moment(e.event_time_confidence_upper).toISOString()).toBe(moment(e.event_time).add(moment.duration(estimate.eventTimeConfidenceUpper)).toISOString());
    });

    test('updateEstimates - mmsi over imo', async () => {
        const estimate: ApiEstimate = Object.assign(newEstimate(), {
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
        const estimate: ApiEstimate = Object.assign(newEstimate(), {
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
        const estimate: ApiEstimate = Object.assign(newEstimate(), {
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
        const estimate: ApiEstimate = newEstimate();

        await Promise.all(updateEstimates(db, [estimate]));
        await Promise.all(updateEstimates(db, [estimate]));

        expect((await findAll(db)).length).toBe(1);
    });

    test('findByLocode - found', async () => {
        const estimate: ApiEstimate = newEstimate();
        await insert(db, [estimate]);

        const foundEstimate = await findByLocode(db, estimate.location.port);

        expect(foundEstimate.length).toBe(1);
    });

    test('findByLocode - not found', async () => {
        const estimate: ApiEstimate = newEstimate();
        await insert(db, [estimate]);

        const foundEstimate = await findByLocode(db, 'AA111');

        expect(foundEstimate.length).toBe(0);
    });

}));
