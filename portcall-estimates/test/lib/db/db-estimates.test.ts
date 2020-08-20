import moment from 'moment';
import * as pgPromise from "pg-promise";
import {dbTestBase,findAll} from "../db-testutil";
import {newEstimate} from "../testdata";
import {ShipIdType, updateEstimates} from "../../../lib/db/db-estimates";
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
        const estimate: ApiEstimate = Object.assign(newEstimate());

        await Promise.all(updateEstimates(db, [estimate]));
        await Promise.all(updateEstimates(db, [estimate]));

        expect((await findAll(db)).length).toBe(1);
    });

}));
