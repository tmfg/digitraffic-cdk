import moment from 'moment';
import * as pgPromise from "pg-promise";
import {dbTestBase, insert} from "../../db-testutil";
import {newEstimate} from "../../testdata";
import {findByImo, findByLocode, findByMmsi, findETAsByLocodes} from "../../../../lib/estimates/db/db-estimates";
import {EventType} from "../../../../lib/estimates/model/estimate";

describe('db-estimates', dbTestBase((db: pgPromise.IDatabase<any, any>) => {
    /*
        FOUND
     */
    test('findByMmsi - found', async () => {
        const estimate = Object.assign(newEstimate(), {
            recordTime: moment().toISOString() // avoid filtering
        });
        await insert(db, [estimate]);

        const foundEstimate = await findByMmsi(db, estimate.ship.mmsi!!);
        expect(foundEstimate.length).toBe(1);
    });

    test('findByImo - found', async () => {
        const estimate = Object.assign(newEstimate(), {
            recordTime: moment().toISOString() // avoid filtering
        });
        await insert(db, [estimate]);

        const foundEstimate = await findByImo(db, estimate.ship.imo!!);
        expect(foundEstimate.length).toBe(1);
    });

    test('findByLocode - found', async () => {
        const estimate = Object.assign(newEstimate(), {
            recordTime: moment().toISOString() // avoid filtering
        });
        await insert(db, [estimate]);

        const foundEstimate = await findByLocode(db, estimate.location.port);
        expect(foundEstimate.length).toBe(1);
    });

    /*
        NOT FOUND
     */
    test('findByMmsi - not found', async () => {
        const estimate = Object.assign(newEstimate(), {
            recordTime: moment().toISOString() // avoid filtering
        });
        await insert(db, [estimate]);

        const foundEstimate = await findByMmsi(db, estimate.ship.mmsi!! - 1);
        expect(foundEstimate.length).toBe(0);
    });

    test('findByImo - not found', async () => {
        const estimate = Object.assign(newEstimate(), {
            recordTime: moment().toISOString() // avoid filtering
        });
        await insert(db, [estimate]);

        const foundEstimate = await findByImo(db, estimate.ship.imo!! - 1);
        expect(foundEstimate.length).toBe(0);
    });

    test('findByLocode - not found', async () => {
        const estimate = Object.assign(newEstimate(), {
            recordTime: moment().toISOString() // avoid filtering
        });
        await insert(db, [estimate]);

        const foundEstimate = await findByLocode(db, estimate.location.port + 'asdf');
        expect(foundEstimate.length).toBe(0);
    });

    /*
        NEWEST RECORD
     */
    test('findByMmsi - multiple - only newest', async () => {
        const estimate = newEstimate();
        const estimate2Date = new Date();
        estimate2Date.setMilliseconds(0);
        const estimate2 = {...estimate,
            eventTime: moment(estimate2Date).add(5, 'hour').toISOString(),
            recordTime: moment(estimate2Date).add(5, 'hour').toISOString()
        };
        await insert(db, [estimate, estimate2]);

        const foundEstimate = await findByMmsi(db, estimate.ship.mmsi!!);

        expect(foundEstimate.length).toBe(1);
        expect(moment(foundEstimate[0].record_time).toISOString()).toBe(estimate2.recordTime);
    });

    test('findByImo - multiple - only newest', async () => {
        const estimate = newEstimate();
        const estimate2Date = new Date();
        estimate2Date.setMilliseconds(0);
        const estimate2 = {...estimate,
            eventTime: moment(estimate2Date).add(5, 'hour').toISOString(),
            recordTime: moment(estimate2Date).add(5, 'hour').toISOString()
        };
        await insert(db, [estimate, estimate2]);

        const foundEstimate = await findByImo(db, estimate.ship.imo!!);

        expect(foundEstimate.length).toBe(1);
        expect(moment(foundEstimate[0].record_time).toISOString()).toBe(estimate2.recordTime);
    });

    test('findByLocode - multiple - only newest', async () => {
        const estimate = newEstimate();
        const estimate2Date = new Date();
        estimate2Date.setMilliseconds(0);
        const estimate2 = {...estimate,
            eventTime: moment(estimate2Date).add(5, 'hour').toISOString(),
            recordTime: moment(estimate2Date).add(5, 'hour').toISOString()
        };
        await insert(db, [estimate, estimate2]);

        const foundEstimate = await findByLocode(db, estimate.location.port);

        expect(foundEstimate.length).toBe(1);
        expect(moment(foundEstimate[0].record_time).toISOString()).toBe(estimate2.recordTime);
    });

    /*
        DATE FILTERING
     */
    test('findByMmsi - too old', async () => {
        const estimate = Object.assign(newEstimate(), {
            eventTime: moment().subtract('13', 'days').toISOString() // enable filtering
        });
        await insert(db, [estimate]);

        const foundEstimate = await findByMmsi(db, estimate.ship.mmsi!!);
        expect(foundEstimate.length).toBe(0);
    });

    test('findByImo - too old', async () => {
        const estimate = Object.assign(newEstimate(), {
            eventTime: moment().subtract('13', 'days').toISOString() // enable filtering
        });
        await insert(db, [estimate]);

        const foundEstimate = await findByImo(db, estimate.ship.imo!!);
        expect(foundEstimate.length).toBe(0);
    });

    test('findByLocode - too old', async () => {
        const estimate = Object.assign(newEstimate(), {
            eventTime: moment().subtract('13', 'days').toISOString() // enable filtering
        });
        await insert(db, [estimate]);

        const foundEstimate = await findByLocode(db, estimate.location.port);
        expect(foundEstimate.length).toBe(0);
    });

    test('findByMmsi - too far in the future', async () => {
        const estimate = Object.assign(newEstimate(), {
            eventTime: moment().add('4', 'days').toISOString() // enable filtering
        });
        await insert(db, [estimate]);

        const foundEstimate = await findByMmsi(db, estimate.ship.mmsi!!);
        expect(foundEstimate.length).toBe(0);
    });

    test('findByImo - too far in the future', async () => {
        const estimate = Object.assign(newEstimate(), {
            eventTime: moment().add('4', 'days').toISOString() // enable filtering
        });
        await insert(db, [estimate]);

        const foundEstimate = await findByImo(db, estimate.ship.imo!!);
        expect(foundEstimate.length).toBe(0);
    });

    test('findByLocode - too far in the future', async () => {
        const estimate = Object.assign(newEstimate(), {
            eventTime: moment().add('4', 'days').toISOString() // enable filtering
        });
        await insert(db, [estimate]);

        const foundEstimate = await findByLocode(db, estimate.location.port);
        expect(foundEstimate.length).toBe(0);
    });

    /*
        MULTIPLE SOURCES
     */
    test('findByMmsi - two sources', async () => {
        const mmsi = 123;
        const estimateSource1 = Object.assign(newEstimate({mmsi}), {
            source: 'source1'
        });
        const estimateSource2 = Object.assign(newEstimate({mmsi}), {
            source: 'source2'
        });
        await insert(db, [estimateSource1, estimateSource2]);

        const foundEstimate = await findByMmsi(db, mmsi);
        expect(foundEstimate.length).toBe(2);
    });

    test('findByImo - two sources', async () => {
        const imo = 456;
        const estimateSource1 = Object.assign(newEstimate({imo}), {
            source: 'source1'
        });
        const estimateSource2 = Object.assign(newEstimate({imo}), {
            source: 'source2'
        });
        await insert(db, [estimateSource1, estimateSource2]);

        const foundEstimate = await findByImo(db, imo);
        expect(foundEstimate.length).toBe(2);
    });

    test('findByLocode - two sources', async () => {
        const locode = 'AA111';
        const estimateSource1 = Object.assign(newEstimate({locode}), {
            source: 'source1'
        });
        const estimateSource2 = Object.assign(newEstimate({locode}), {
            source: 'source2'
        });
        await insert(db, [estimateSource1, estimateSource2]);

        const foundEstimate = await findByLocode(db, locode);
        expect(foundEstimate.length).toBe(2);
    });

    test('findETAsByLocodes - 1 h in future is found', async () => {
        const locode = 'AA123';
        const eventTime = moment().add(1, 'hours').toDate();
        const estimate = newEstimate({eventType: EventType.ETA, locode, eventTime, source: 'Portnet'});
        await insert(db, [estimate]);

        const foundEstimates = await findETAsByLocodes(db, [locode]);

        expect(foundEstimates.length).toBe(1);
        expect(foundEstimates[0]).toMatchObject({
            locode,
            imo: estimate.ship.imo
        });
    });

    test('findETAsByLocodes - 1 h in past is not found', async () => {
        const locode = 'AA123';
        const eventTime = moment().subtract(1, 'hours').toDate();
        const estimate = newEstimate({eventType: EventType.ETA, locode, eventTime, source: 'Portnet'});
        await insert(db, [estimate]);

        const foundEstimates = await findETAsByLocodes(db, [locode]);

        expect(foundEstimates.length).toBe(0);
    });

    test('findETAsByLocodes - ETD not found', async () => {
        const locode = 'AA123';
        const eventTime = moment().add(1, 'hours').toDate();
        const estimate = newEstimate({eventType: EventType.ETD, locode, eventTime, source: 'Portnet'});
        await insert(db, [estimate]);

        const foundEstimates = await findETAsByLocodes(db, [locode]);

        expect(foundEstimates.length).toBe(0);
    });

    test('findETAsByLocodes - non-matching locode not found', async () => {
        const locode = 'AA123';
        const eventTime = moment().add(1, 'hours').toDate();
        const estimate = newEstimate({eventType: EventType.ETA, locode: 'BB456', eventTime, source: 'Portnet'});
        await insert(db, [estimate]);

        const foundEstimates = await findETAsByLocodes(db, [locode]);

        expect(foundEstimates.length).toBe(0);
    });

    test('findETAsByLocodes - only Portnet is found', async () => {
        const locode = 'AA123';
        const eventTime = moment().add(1, 'hours').toDate();
        const estimate1 = newEstimate({eventType: EventType.ETA, locode, eventTime, source: 'Portnet'});
        const estimate2 = newEstimate({eventType: EventType.ETA, locode, eventTime, source: 'S1'});
        const estimate3 = newEstimate({eventType: EventType.ETA, locode, eventTime, source: 'S2'});
        const estimate4 = newEstimate({eventType: EventType.ETA, locode, eventTime, source: 'S3'});
        await insert(db, [estimate1, estimate2, estimate3, estimate4]);

        const foundEstimates = await findETAsByLocodes(db, [locode]);

        expect(foundEstimates.length).toBe(1);
    });

}));
