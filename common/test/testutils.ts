export function randomString() : string {
    return Math.random().toString(36).substring(2);
}

export function getRandomNumber(min: number , max: number) : number {
    return Math.random() * (max - min) + min;
}

export function getRandomNumberAsString(min: number , max: number) : string {
    return (Math.random() * (max - min) + min).toString();
}

export function randomBoolean(): boolean {
    return Math.random() < 0.5;
}
