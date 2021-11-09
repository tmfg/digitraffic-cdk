export function isValidIMO(imo: number): boolean {
    return imo >= 1000000 && imo <= 9999999;
}

export function isValidMMSI(mmsi: number): boolean {
    return mmsi >= 100000000 && mmsi <= 999999999;
}

const LocodePattern = /^FI[A-Z]{3}$/i;

export function isValidLOCODE(locode: string): boolean {
    return LocodePattern.test(locode);
}
