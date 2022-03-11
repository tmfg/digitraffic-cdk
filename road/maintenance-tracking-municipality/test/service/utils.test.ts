import * as Utils from "../../lib/service/utils";
import moment from "moment";
import {DbMaintenanceTracking} from "../../lib/model/db-data";
import {createGeoJSONPoint, createLineStringGeometry} from "../testutil";
import {getRandomInteger} from "digitraffic-common/test/testutils";
import {Position} from "geojson";

const ISO = "2022-01-02T01:02:03.004Z";
const END_POINT: Position = [27.688935, 62.892983];

describe('UtilsTests', () => {

    test('dateFromIsoString', () => {
        const parsed = Utils.dateFromIsoString(ISO);
        expect(parsed?.toISOString()).toEqual(ISO);
    });

    test('dateFromIsoStringOptional', () => {
        const parsed = Utils.dateFromIsoStringOptional(ISO);
        expect(parsed).toBeDefined();
        expect(parsed?.toISOString()).toEqual(ISO);
    });

    test('dateFromIsoStringOptional undefined', () => {
        const ud = Utils.dateFromIsoStringOptional();
        expect(ud).toBeUndefined();
    });

    test('createHarjaId', () => {
        const id : bigint = Utils.createHarjaId('3330de39-9d1d-457b-a6fd-a800cf6e7f99');
        expect(id).toBe(BigInt('365522198665597071').valueOf());
    });

    test('createHarjaIdNotEqual', () => {
        const id1 : bigint = Utils.createHarjaId('3330de39-9d1d-457b-a6fd-a800cf6e7f99');
        const id2 : bigint = Utils.createHarjaId('3330de39-9d1d-457b-a6fd-a800cf6e7f98');
        expect(id1).not.toEqual(id2);
    });

    test('countEstimatedSizeOfMessage', () => {
        const message = `{"message":"This is a message"}`;
        const objectMessage = JSON.parse(message);
        const messageSize = Utils.countEstimatedSizeOfMessage(message);
        const objectMessageSize = Utils.countEstimatedSizeOfMessage(objectMessage);
        expect(messageSize).toEqual(31);
        expect(messageSize).toEqual(objectMessageSize);
    });

    test('countEstimatedSizeOfMessage null and undefined', () => {
        /* eslint-disable */
        expect(Utils.countEstimatedSizeOfMessage(null!)).toEqual(0);
        expect(Utils.countEstimatedSizeOfMessage(undefined!)).toEqual(0);
        /* eslint-enable */
    });

    test('hasBothStringArraysSameValues', () => {
        expect(Utils.hasBothStringArraysSameValues([], [])).toEqual(true);
        expect(Utils.hasBothStringArraysSameValues(['a'], ['a'])).toEqual(true);
        expect(Utils.hasBothStringArraysSameValues(['a'], ['a','a'])).toEqual(true);
        expect(Utils.hasBothStringArraysSameValues(['a','a'], ['a','a'])).toEqual(true);

        /* eslint-disable */
        expect(Utils.hasBothStringArraysSameValues(null!, null!)).toEqual(true);
        expect(Utils.hasBothStringArraysSameValues(undefined!, undefined!)).toEqual(true);
        expect(Utils.hasBothStringArraysSameValues(null!, undefined!)).toEqual(true);
        expect(Utils.hasBothStringArraysSameValues(['a'], undefined!)).toEqual(false);
        expect(Utils.hasBothStringArraysSameValues(['a'], null!)).toEqual(false);
        /* eslint-enable */
        expect(Utils.hasBothStringArraysSameValues(['a','b'], ['a','a'])).toEqual(false);
        expect(Utils.hasBothStringArraysSameValues(['a', 'a', 'a'], ['a', 'b', 'c'])).toEqual(false);

    });

    test('calculateSpeedInKmH', () => {
        expect(Utils.calculateSpeedInKmH(1, 60*60*1000)).toEqual(1);
    });

    test('countDiffMs', () => {
        const start = new Date();
        const end = moment(start).add(1234, 'milliseconds').toDate();
        expect(Utils.countDiffMs(start, end)).toEqual(1234);
    });

    test('getTrackingStartPoint with line string', () => {
        const mt = createDbMaintenanceTracking(true);
        const start = Utils.getTrackingStartPoint(mt);
        expect(start[0]).toEqual(mt.line_string?.coordinates[0][0]);
        expect(start[1]).toEqual(mt.line_string?.coordinates[0][1]);
    });

    test('getTrackingStartPoint without line string', () => {
        const mt = createDbMaintenanceTracking(false);
        const start = Utils.getTrackingStartPoint(mt);
        expect(start[0]).toEqual(END_POINT[0]);
        expect(start[1]).toEqual(END_POINT[1]);
    });

});

function createDbMaintenanceTracking(withLineString: boolean): DbMaintenanceTracking {
    return {
        /* eslint-disable */
        contract: "",
        domain: "",
        end_time: new Date(),
        finished: false,
        last_point: createGeoJSONPoint(END_POINT),
        line_string: withLineString ? createLineStringGeometry(getRandomInteger(5, 10), 0.1) : null,
        message_original_id: "",
        sending_system: "",
        sending_time: new Date(),
        start_time: new Date(),
        tasks: [],
        work_machine_id: 0,
        /* eslint-enable */
    };
}