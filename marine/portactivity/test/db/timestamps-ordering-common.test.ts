import {dbTestBase, insert} from "../db-testutil";
import {newTimestamp} from "../testdata";
import * as TimestampsDb from "../../lib/db/timestamps";
import {DbTimestamp} from "../../lib/db/timestamps";
import {DTDatabase} from "digitraffic-common/database/database";
import {shuffle} from "digitraffic-common/test/testutils";

describe('db-timestamps - ordering', dbTestBase((db: DTDatabase) => {

    const locode = 'BB456';
    generateOrderingTest('locode',
        {locode},
        () => locode,
        (identifier: string | number) => TimestampsDb.findByLocode(db, identifier as string));

    const mmsi = 123;
    generateOrderingTest('mmsi',
        {mmsi},
        () => mmsi,
        (identifier: string | number) => TimestampsDb.findByMmsi(db, identifier as number));

    const imo = 123;
    generateOrderingTest('imo',
        {imo},
        () => imo,
        (identifier: string | number) => TimestampsDb.findByImo(db, identifier as number));

    /**
     * Generates common ordering tests for locode, mmsi, imo.
     *
     * @param idPropText Description of id property
     * @param idProp Id property for fetching test data
     * @param getIdProp Method for fetching id property
     * @param fetchMethod Method for fetching test data
     */
    function generateOrderingTest(idPropText: string,
        idProp: { mmsi?: number, imo?: number, locode?: string },
        getIdProp: () => number | string,
        fetchMethod: (identifier: string | number) => Promise<DbTimestamp[]>) {

        const testMmsi = 123;
        const testLocode = 'AA123';

        test(`find by ${idPropText} - most accurate first - lower`, async () => {
            const timestampSource1 = newTimestamp(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source1',
                eventTimeConfidenceLower: 'PT4H',
                eventTimeConfidenceUpper: 'PT10H',
            }, idProp));
            const timestampSource2 = newTimestamp(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source2',
                eventTimeConfidenceLower: 'PT1H',
                eventTimeConfidenceUpper: 'PT10H',
            }, idProp));
            const timestampSource3 = newTimestamp(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source3',
                eventTimeConfidenceLower: 'PT8H',
                eventTimeConfidenceUpper: 'PT10H',
            }, idProp));
            const timestamps = shuffle([timestampSource1, timestampSource2, timestampSource3]);
            await insert(db, timestamps);

            const foundTimestamps = await fetchMethod(getIdProp());
            const foundTimestamp = foundTimestamps[0];
            expect(foundTimestamp.event_time_confidence_lower).toBe(timestampSource2.eventTimeConfidenceLower);
            expect(foundTimestamp.event_time_confidence_upper).toBe(timestampSource2.eventTimeConfidenceUpper);
        });

        test(`find by ${idPropText} - most accurate first - upper`, async () => {
            const timestampSource1 = newTimestamp(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source1',
                eventTimeConfidenceLower: 'PT10H',
                eventTimeConfidenceUpper: 'PT4H',
            }, idProp));
            const timestampSource2 = newTimestamp(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source2',
                eventTimeConfidenceLower: 'PT10H',
                eventTimeConfidenceUpper: 'PT2H',
            }, idProp));
            const timestampSource3 = newTimestamp(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source3',
                eventTimeConfidenceLower: 'PT18H',
                eventTimeConfidenceUpper: 'PT8H',
            }, idProp));
            const timestamps = shuffle([timestampSource1, timestampSource2, timestampSource3]);
            await insert(db, timestamps);

            const foundTimestamps = await fetchMethod(getIdProp());
            const foundTimestamp = foundTimestamps[0];
            expect(foundTimestamp.event_time_confidence_lower).toBe(timestampSource2.eventTimeConfidenceLower);
            expect(foundTimestamp.event_time_confidence_upper).toBe(timestampSource2.eventTimeConfidenceUpper);
        });

        test(`find by ${idPropText} - most accurate first - both`, async () => {
            // confidence 14 H
            const timestampSource1 = newTimestamp(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source1',
                eventTimeConfidenceLower: 'PT10H',
                eventTimeConfidenceUpper: 'PT4H',
            }, idProp));
            // confidence 12 H
            const timestampSource2 = newTimestamp(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source2',
                eventTimeConfidenceLower: 'PT10H',
                eventTimeConfidenceUpper: 'PT2H',
            }, idProp));
            // confidence 26 H
            const timestampSource3 = newTimestamp(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source3',
                eventTimeConfidenceLower: 'PT18H',
                eventTimeConfidenceUpper: 'PT8H',
            }, idProp));
            const timestamps = shuffle([timestampSource1, timestampSource2, timestampSource3]);
            await insert(db, timestamps);

            const foundTimestamps = await fetchMethod(getIdProp());
            const foundTimestamp = foundTimestamps[0];
            expect(foundTimestamp.event_time_confidence_lower).toBe(timestampSource2.eventTimeConfidenceLower);
            expect(foundTimestamp.event_time_confidence_upper).toBe(timestampSource2.eventTimeConfidenceUpper);
        });

        test(`find by ${idPropText} - most accurate first - null lower last`, async () => {
            const timestampSource1 = newTimestamp(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source1',
                eventTimeConfidenceLower: 'PT10H',
                eventTimeConfidenceUpper: 'PT4H',
            }, idProp));
            const timestampSource2 = newTimestamp(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source2',
                eventTimeConfidenceLower: null,
                eventTimeConfidenceUpper: 'PT29H',
            }, idProp));
            const timestampSource3 = newTimestamp(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source3',
                eventTimeConfidenceLower: 'PT18H',
                eventTimeConfidenceUpper: 'PT8H',
            }, idProp));
            const timestamps = shuffle([timestampSource1, timestampSource2, timestampSource3]);
            await insert(db, timestamps);

            const foundTimestamps = await fetchMethod(getIdProp());
            const foundTimestamp = foundTimestamps[2];
            expect(foundTimestamp.event_time_confidence_lower).toBeNull();
            expect(foundTimestamp.event_time_confidence_upper).toBe(timestampSource2.eventTimeConfidenceUpper);
        });

        test(`find by ${idPropText} - most accurate first - null upper last`, async () => {
            const timestampSource1 = newTimestamp(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source1',
                eventTimeConfidenceLower: 'PT10H',
                eventTimeConfidenceUpper: 'PT4H',
            }, idProp));
            const timestampSource2 = newTimestamp(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source2',
                eventTimeConfidenceLower: 'PT29H',
                eventTimeConfidenceUpper: null,
            }, idProp));
            const timestampSource3 = newTimestamp(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source3',
                eventTimeConfidenceLower: 'PT18H',
                eventTimeConfidenceUpper: 'PT8H',
            }, idProp));
            const timestamps = shuffle([timestampSource1, timestampSource2, timestampSource3]);
            await insert(db, timestamps);

            const foundTimestamps = await fetchMethod(getIdProp());
            const foundTimestamp = foundTimestamps[2];
            expect(foundTimestamp.event_time_confidence_lower).toBe(timestampSource2.eventTimeConfidenceLower);
            expect(foundTimestamp.event_time_confidence_upper).toBeNull();
        });

        test(`find by ${idPropText} - most accurate first - both null last`, async () => {
            const timestampSource1 = newTimestamp(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source1',
                eventTimeConfidenceLower: 'PT10H',
                eventTimeConfidenceUpper: 'PT4H',
            }, idProp));
            const timestampSource2 = newTimestamp(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source2',
                eventTimeConfidenceLower: null,
                eventTimeConfidenceUpper: null,
            }, idProp));
            const timestampSource3 = newTimestamp(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source3',
                eventTimeConfidenceLower: 'PT18H',
                eventTimeConfidenceUpper: 'PT8H',
            }, idProp));
            const timestamps = shuffle([timestampSource1, timestampSource2, timestampSource3]);
            await insert(db, timestamps);

            const foundTimestamps = await fetchMethod(getIdProp());
            const foundTimestamp = foundTimestamps[2];
            expect(foundTimestamp.event_time_confidence_lower).toBeNull();
            expect(foundTimestamp.event_time_confidence_upper).toBeNull();
        });
    }

}));
