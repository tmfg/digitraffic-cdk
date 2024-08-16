import * as ArrayUtils from "../../utils/utils.js";

describe("ArrayUtils", () => {
    test("bothArraysHasSameValues", () => {
        expect(ArrayUtils.bothArraysHasSameValues([], [])).toEqual(true);
        expect(ArrayUtils.bothArraysHasSameValues(["a"], ["a"])).toEqual(true);
        expect(ArrayUtils.bothArraysHasSameValues(["a"], ["a", "a"])).toEqual(true);
        expect(ArrayUtils.bothArraysHasSameValues(["a", "a"], ["a", "a"])).toEqual(true);

        expect(ArrayUtils.bothArraysHasSameValues(null, null)).toEqual(true);
        expect(ArrayUtils.bothArraysHasSameValues(undefined, undefined)).toEqual(true);
        expect(ArrayUtils.bothArraysHasSameValues(null, undefined)).toEqual(true);
        expect(ArrayUtils.bothArraysHasSameValues(["a"], undefined)).toEqual(false);
        expect(ArrayUtils.bothArraysHasSameValues(["a"], null)).toEqual(false);
        /* eslint-enable */
        expect(ArrayUtils.bothArraysHasSameValues(["a", "b"], ["a", "a"])).toEqual(false);
        expect(ArrayUtils.bothArraysHasSameValues(["a", "a", "a"], ["a", "b", "c"])).toEqual(false);

        const o1 = { a: 1, b: 2 };
        const o2 = { a: 1, b: 2 };
        // Objects are references to same
        expect(ArrayUtils.bothArraysHasSameValues([o1], [o1])).toEqual(true);
        // Object's are not the same but the contents are the same
        expect(ArrayUtils.bothArraysHasSameValues([o1], [o2])).toEqual(false);
    });

    test("getFirst - empty throws", () => {
        expect(() => {
            ArrayUtils.getFirst([]);
        }).toThrow();
    });

    test("getFirst - two objects", () => {
        expect(ArrayUtils.getFirst([1, 2])).toEqual(1);
    });

    test("getFirst - two objects with sort function", () => {
        expect(ArrayUtils.getFirst([1, 2], (a) => -a)).toEqual(2);
    });

    test("getLast - empty throws", () => {
        expect(() => {
            ArrayUtils.getLast([]);
        }).toThrow();
    });

    test("getLast - two objects", () => {
        expect(ArrayUtils.getLast([1, 2])).toEqual(2);
    });

    test("isDefined", () => {
        expect([1, 2, undefined, null, 3].filter(ArrayUtils.isDefined)).toEqual([1, 2, 3]);
    });
});
