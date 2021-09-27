export type ApiCounter = {
    readonly id: number,
    readonly domain: string,
    readonly name: string,
    readonly latitude: number,
    readonly longitude: number,
    readonly userType: number;
    readonly interval: number;
    readonly sens: number;
}