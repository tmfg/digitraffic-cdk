import * as pgPromise from "pg-promise";
import {dbTestBase, insert} from "../../db-testutil";
import {newEstimate} from "../../testdata";
import {
    DbEstimate,
    findByImo,
    findByLocode,
    findByMmsi,
} from "../../../../lib/estimates/db/db-estimates";
import {shuffle} from "../../../../../../common/js/js-utils";

describe('db-estimates - ordering', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    const locode = 'BB456';
    generateOrderingTest(
        'locode',
        {locode},
        () => locode,
        (identifier: any) => findByLocode(db, identifier as string));

    const mmsi = 123;
    generateOrderingTest(
        'mmsi',
        {mmsi},
        () => mmsi,
        (identifier: any) => findByMmsi(db, identifier as number));

    const imo = 123;
    generateOrderingTest(
        'imo',
        {imo},
        () => imo,
        (identifier: any) => findByImo(db, identifier as number));

    /**
     * Generates common ordering tests for locode, mmsi, imo.
     *
     * @param idPropText Description of id property
     * @param idProp Id property for fetching test data
     * @param getIdProp Method for fetching id property
     * @param fetchMethod Method for fetching test data
     */
    function generateOrderingTest(
        idPropText: string,
        idProp: { mmsi?: number, imo?: number, locode?: string },
        getIdProp: () => any,
        fetchMethod: (identifier: any) => Promise<DbEstimate[]>) {

        const testMmsi = 123;
        const testLocode = 'AA123';

        test(`find by ${idPropText} - most accurate first - lower`, async () => {
            const estimateSource1 = newEstimate(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source1',
                eventTimeConfidenceLower: 'PT4H',
                eventTimeConfidenceUpper: 'PT10H'
            }, idProp));
            const estimateSource2 = newEstimate(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source2',
                eventTimeConfidenceLower: 'PT1H',
                eventTimeConfidenceUpper: 'PT10H'
            }, idProp));
            const estimateSource3 = newEstimate(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source3',
                eventTimeConfidenceLower: 'PT8H',
                eventTimeConfidenceUpper: 'PT10H'
            }, idProp));
            const estimates = shuffle([estimateSource1, estimateSource2, estimateSource3]);
            await insert(db, estimates);

            const foundEstimates = await fetchMethod(getIdProp());
            const foundEstimate = foundEstimates[0];
            expect(foundEstimate.event_time_confidence_lower).toBe(estimateSource2.eventTimeConfidenceLower);
            expect(foundEstimate.event_time_confidence_upper).toBe(estimateSource2.eventTimeConfidenceUpper);
        });

        test(`find by ${idPropText} - most accurate first - upper`, async () => {
            const estimateSource1 = newEstimate(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source1',
                eventTimeConfidenceLower: 'PT10H',
                eventTimeConfidenceUpper: 'PT4H'
            }, idProp));
            const estimateSource2 = newEstimate(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source2',
                eventTimeConfidenceLower: 'PT10H',
                eventTimeConfidenceUpper: 'PT2H'
            }, idProp));
            const estimateSource3 = newEstimate(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source3',
                eventTimeConfidenceLower: 'PT18H',
                eventTimeConfidenceUpper: 'PT8H'
            }, idProp));
            const estimates = shuffle([estimateSource1, estimateSource2, estimateSource3]);
            await insert(db, estimates);

            const foundEstimates = await fetchMethod(getIdProp());
            const foundEstimate = foundEstimates[0];
            expect(foundEstimate.event_time_confidence_lower).toBe(estimateSource2.eventTimeConfidenceLower);
            expect(foundEstimate.event_time_confidence_upper).toBe(estimateSource2.eventTimeConfidenceUpper);
        });

        test(`find by ${idPropText} - most accurate first - both`, async () => {
            // confidence 14 H
            const estimateSource1 = newEstimate(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source1',
                eventTimeConfidenceLower: 'PT10H',
                eventTimeConfidenceUpper: 'PT4H'
            }, idProp));
            // confidence 12 H
            const estimateSource2 = newEstimate(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source2',
                eventTimeConfidenceLower: 'PT10H',
                eventTimeConfidenceUpper: 'PT2H'
            }, idProp));
            // confidence 26 H
            const estimateSource3 = newEstimate(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source3',
                eventTimeConfidenceLower: 'PT18H',
                eventTimeConfidenceUpper: 'PT8H'
            }, idProp));
            const estimates = shuffle([estimateSource1, estimateSource2, estimateSource3]);
            await insert(db, estimates);

            const foundEstimates = await fetchMethod(getIdProp());
            const foundEstimate = foundEstimates[0];
            expect(foundEstimate.event_time_confidence_lower).toBe(estimateSource2.eventTimeConfidenceLower);
            expect(foundEstimate.event_time_confidence_upper).toBe(estimateSource2.eventTimeConfidenceUpper);
        });

        test(`find by ${idPropText} - most accurate first - null lower last`, async () => {
            const estimateSource1 = newEstimate(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source1',
                eventTimeConfidenceLower: 'PT10H',
                eventTimeConfidenceUpper: 'PT4H'
            }, idProp));
            const estimateSource2 = newEstimate(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source2',
                eventTimeConfidenceLower: null,
                eventTimeConfidenceUpper: 'PT29H'
            }, idProp));
            const estimateSource3 = newEstimate(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source3',
                eventTimeConfidenceLower: 'PT18H',
                eventTimeConfidenceUpper: 'PT8H'
            }, idProp));
            const estimates = shuffle([estimateSource1, estimateSource2, estimateSource3]);
            await insert(db, estimates);

            const foundEstimates = await fetchMethod(getIdProp());
            const foundEstimate = foundEstimates[2];
            expect(foundEstimate.event_time_confidence_lower).toBeNull();
            expect(foundEstimate.event_time_confidence_upper).toBe(estimateSource2.eventTimeConfidenceUpper);
        });

        test(`find by ${idPropText} - most accurate first - null upper last`, async () => {
            const estimateSource1 = newEstimate(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source1',
                eventTimeConfidenceLower: 'PT10H',
                eventTimeConfidenceUpper: 'PT4H'
            }, idProp));
            const estimateSource2 = newEstimate(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source2',
                eventTimeConfidenceLower: 'PT29H',
                eventTimeConfidenceUpper: null
            }, idProp));
            const estimateSource3 = newEstimate(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source3',
                eventTimeConfidenceLower: 'PT18H',
                eventTimeConfidenceUpper: 'PT8H'
            }, idProp));
            const estimates = shuffle([estimateSource1, estimateSource2, estimateSource3]);
            await insert(db, estimates);

            const foundEstimates = await fetchMethod(getIdProp());
            const foundEstimate = foundEstimates[2];
            expect(foundEstimate.event_time_confidence_lower).toBe(estimateSource2.eventTimeConfidenceLower);
            expect(foundEstimate.event_time_confidence_upper).toBeNull();
        });

        test(`find by ${idPropText} - most accurate first - both null last`, async () => {
            const estimateSource1 = newEstimate(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source1',
                eventTimeConfidenceLower: 'PT10H',
                eventTimeConfidenceUpper: 'PT4H'
            }, idProp));
            const estimateSource2 = newEstimate(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source2',
                eventTimeConfidenceLower: null,
                eventTimeConfidenceUpper: null
            }, idProp));
            const estimateSource3 = newEstimate(Object.assign({
                mmsi: testMmsi,
                locode: testLocode,
                source: 'source3',
                eventTimeConfidenceLower: 'PT18H',
                eventTimeConfidenceUpper: 'PT8H'
            }, idProp));
            const estimates = shuffle([estimateSource1, estimateSource2, estimateSource3]);
            await insert(db, estimates);

            const foundEstimates = await fetchMethod(getIdProp());
            const foundEstimate = foundEstimates[2];
            expect(foundEstimate.event_time_confidence_lower).toBeNull();
            expect(foundEstimate.event_time_confidence_upper).toBeNull();
        });
    }

}));
