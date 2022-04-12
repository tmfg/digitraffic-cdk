/**
 * Check if arrays have only elements that also exists also in other array.
 * Individual element count doesn't matter.
 * Function works only for primitive types and for other it just checks the reference to object.
 *
 * Some examples
 * bothArraysHasSameValues( [a, b], [b, a] )    => true
 * bothArraysHasSameValues( [a, a], [a, a, a] ) => true
 * bothArraysHasSameValues( [a, b], [a] )       => false
 *
 * Object references:
 * const o1 = { a: 1, b: 2};
 * const o2 = { a: 1, b: 2};
 * // Arrays has references to same objects
 * bothArraysHasSameValues([o1], [o1]))         => true
 * Arrays have references to different objects
 * bothArraysHasSameValues([o1], [o2]))         => false
 *
 * @param a first array to compare
 * @param b second array to compare
 */
export function bothArraysHasSameValues(a: unknown[], b: unknown[]): boolean {
    if ((a && !b) || (!a && b)) {
        return false;
    } else if (!a && !b) {
        return true;
    }
    const aSet = new Set(a);
    const bSet = new Set(b);
    if (aSet.size !== bSet.size) {
        return false;
    }
    return Array.from(aSet).every(value => bSet.has(value));
}
