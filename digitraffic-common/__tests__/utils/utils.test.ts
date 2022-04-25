import * as CommonUtils from "../../utils/utils";

describe('CommonUtilsTest', () => {

    test('bothArraysHasSameValues', () => {
        expect(CommonUtils.bothArraysHasSameValues([], [])).toEqual(true);
        expect(CommonUtils.bothArraysHasSameValues(['a'], ['a'])).toEqual(true);
        expect(CommonUtils.bothArraysHasSameValues(['a'], ['a', 'a'])).toEqual(true);
        expect(CommonUtils.bothArraysHasSameValues(['a', 'a'], ['a', 'a'])).toEqual(true);

        expect(CommonUtils.bothArraysHasSameValues(null, null)).toEqual(true);
        expect(CommonUtils.bothArraysHasSameValues(undefined, undefined)).toEqual(true);
        expect(CommonUtils.bothArraysHasSameValues(null, undefined)).toEqual(true);
        expect(CommonUtils.bothArraysHasSameValues(['a'], undefined)).toEqual(false);
        expect(CommonUtils.bothArraysHasSameValues(['a'], null)).toEqual(false);
        /* eslint-enable */
        expect(CommonUtils.bothArraysHasSameValues(['a', 'b'], ['a', 'a'])).toEqual(false);
        expect(CommonUtils.bothArraysHasSameValues(['a', 'a', 'a'], ['a', 'b', 'c'])).toEqual(false);

        const o1 = {a: 1, b: 2};
        const o2 = {a: 1, b: 2};
        // Objects are references to same
        expect(CommonUtils.bothArraysHasSameValues([o1], [o1])).toEqual(true);
        // Object's are not the same but the contents are the same
        expect(CommonUtils.bothArraysHasSameValues([o1], [o2])).toEqual(false);

    });
});