/**
 * Returns a new copy of an array, shuffled using Math.random()
 * @param array Array
 */
export function shuffle(array: any[]): any[] {
    // pretty fast way to copy an array, not necessarily the fastest
    const newArray = array.slice(0)
    newArray.sort((x) => 0.5 - Math.random())
    return newArray
}