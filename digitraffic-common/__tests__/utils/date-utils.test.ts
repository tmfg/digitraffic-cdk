import moment from "moment";
import * as CommonDateUtils from "../../utils/date-utils";

const ISO = "2022-01-02T01:02:03.004Z";

describe('CommonDateUtilsTest', () => {

    test('dateFromIsoString', () => {
        const parsed = CommonDateUtils.dateFromIsoString(ISO);
        expect(parsed.toISOString()).toEqual(ISO);
    });

    test('dateFromIsoString fails', () => {
        expect(() => CommonDateUtils.dateFromIsoString(ISO + "foobar")).toThrowError();
    });

    test('countDiffMs', () => {
        const start = new Date();
        const end = moment(start).add(1234, 'milliseconds').toDate();
        expect (CommonDateUtils.countDiffMs(start, end)).toEqual(1234);
    });

    test('countDiffMs', () => {
        const start = new Date();
        const end = moment(start).add(1234, 'seconds').toDate();
        expect (CommonDateUtils.countDiffInSeconds(start, end)).toEqual(1234);
    });
});