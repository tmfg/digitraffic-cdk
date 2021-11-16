export function isValidIMO(imo: number): boolean {
    return imo >= 1000000 && imo <= 9999999 && imoChecksumIsValid(imo);
}

function imoChecksumIsValid(imo: number): boolean {
    const imoStr = imo.toString();
    const imoChar1 = Number(imoStr[0]);
    const imoChar2 = Number(imoStr[1]);
    const imoChar3 = Number(imoStr[2]);
    const imoChar4 = Number(imoStr[3]);
    const imoChar5 = Number(imoStr[4]);
    const imoChar6 = Number(imoStr[5]);
    const checkDigit = Number(imoStr[6]);
    const checkCalculation = ((imoChar1 * 7) + (imoChar2 * 6) + (imoChar3 * 5) + (imoChar4 * 4) + (imoChar5 * 3) + (imoChar6 * 2)).toString();
    const checkResult = Number(checkCalculation[checkCalculation.length - 1]) === checkDigit;
    if (!checkResult) {
        console.warn('method=imoChecksumIsValid IMO checksum failed %d', imo);
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
