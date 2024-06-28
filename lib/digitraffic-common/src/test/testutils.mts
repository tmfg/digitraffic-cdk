export function randomString() : string {
    return Math.random().toString(36).substring(2);
}

export function getRandomNumber(min: number , max: number) : number {
    return Math.random() * (max - min) + min;
}

export function getRandomNumberAsString(min: number , max: number) : string {
    return getRandomNumber(min, max).toString();
}

export function getRandomInteger(min: number , max: number) : number {
    return Math.round(getRandomNumber(min, max));
}

export function getRandomIntegerAsString(min: number , max: number) : string {
    return Math.round(getRandomInteger(min, max)).toString();
}

export function getRandomBigInt(min: number , max: number) : bigint {
    return BigInt(getRandomInteger(min, max));
}

export function randomBoolean(): boolean {
    return Math.random() < 0.5;
}

/**
 * Returns a new copy of an array, shuffled using Math.random()
 * @param array Array
 */
export function shuffle<T>(array: T[]): T[] {
    // pretty fast way to copy an array, not necessarily the fastest
    const newArray = array.slice(0);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    newArray.sort((_) => 0.5 - Math.random());
    return newArray;
}
