import moment from 'moment';
import * as pgPromise from "pg-promise";
import {dbTestBase, findAll, insert} from "../db-testutil";
import {newEstimate} from "../testdata";
import {findByImo, findByLocode, findByMmsi} from "../../../lib/db/db-estimates";

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

}));
