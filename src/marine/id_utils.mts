import { logger } from "../aws/runtime/dt-logger-default.mjs";

export function isValidIMO(imo: number): boolean {
    return imo >= 1000000 && imo <= 9999999 && imoChecksumIsValid(imo);
}

function imoChecksumIsValid(imo: number): boolean {
    const imoStr = imo.toString();
    const imoDigit1 = Number(imoStr[0]);
    const imoDigit2 = Number(imoStr[1]);
    const imoDigit3 = Number(imoStr[2]);
    const imoDigit4 = Number(imoStr[3]);
    const imoDigit5 = Number(imoStr[4]);
    const imoDigit6 = Number(imoStr[5]);
    const checkDigit = Number(imoStr[6]);
    const checkCalculation = Number(
        imoDigit1 * 7 + imoDigit2 * 6 + imoDigit3 * 5 + imoDigit4 * 4 + imoDigit5 * 3 + imoDigit6 * 2
    );
    const checkResult = checkCalculation % 10 === checkDigit;
    if (!checkResult) {
        logger.warn({ method: "idUtils.imoChecksumIsValid", message: `IMO checksum failed ${imo}` });
    }
    return checkResult;
}

export function isValidMMSI(mmsi: number): boolean {
    return mmsi >= 100000000 && mmsi <= 999999999;
}

const LocodePattern = /^FI[A-Z]{3}$/i;

export function isValidLOCODE(locode: string): boolean {
    return LocodePattern.test(locode);
}
