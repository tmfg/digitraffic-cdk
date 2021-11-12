import {findSymbol, InputSymbols, isValidSymbol, TextSymbol, SymbolType} from "./textSymbol";
import {getSymbolType} from "./textSymbol";
import {InputError} from "digitraffic-common/error/input-error";

const MAX_LENGTH = 30;

const ERROR_TEXT_SYNTAX = "Text must be in form of [text] or text";
const ERROR_NO_CONTENT = "No content";
const ERROR_MAX_LENGTH = `Max length is ${MAX_LENGTH}`;
const ERROR_ONE_UNDERSCORE = "Text can only contain one underscore(_)";
const ERROR_INVALID_SYMBOL = "Invalid symbol";

function error(errorText: string) {
    throw new InputError(errorText);
}

export function convertTextToSvg(text: string): string {
    const checked = validate(text);

    return convert(checked);
}

function validate(text: string): string {
    const checked = checkAndRemoveBrackets(text);
    checkSize(checked);
    checkUnderlines(checked);

    return checked;
}

function checkSize(text: string) {
    if (text.length < 1) {
        error(ERROR_NO_CONTENT);
    } else if (text.length > MAX_LENGTH) {
        error(ERROR_MAX_LENGTH);
    }
}

function checkUnderlines(text: string) {
    const count = text.split('_').length - 1;

    if(count > 1) {
        error(ERROR_ONE_UNDERSCORE);
    }
}

// text can be enclosed in brackets, but no more brackets can be used
function checkAndRemoveBrackets(text: string): string {
    const firstChar = text[0];
    const lastChar = text[text.length - 1];

    const count1 = text.split('[').length - 1;
    const count2 = text.split(']').length - 1;

    if(firstChar === '[') {
        // ok, last char must be ]
        if(lastChar !== ']') {
            error(ERROR_TEXT_SYNTAX);
        } else if(count1 > 1 || count2 > 1) {
            error(ERROR_TEXT_SYNTAX);
        }

        return text.substring(1, text.length - 1);
    }

    if(count1 > 0 || count2 > 0) {
        error(ERROR_TEXT_SYNTAX);
    }

    return text;
}

function convert(text: string): string {
    const symbols = findUsedSymbolTexts(text);
    const symbolList = convertToSymbols(symbols);

    return creteSvg(symbolList);
}

// create svg from symbols
function creteSvg(symbolList: TextSymbol[]): string {
    // first introduce symbols in svg, only once each
    const symbolsText = Array.from(new Set(symbolList).values()).map((s) => s.getSvg()).join('\n');

    let useText = '';
    let width= 0;

    // then use introduced symbols
    symbolList.forEach((symbol: TextSymbol) => {
        useText+= `<use href="#${symbol.name}" x="${width}" y="0" width="${symbol.width}" height="32"/>\n`;
        width+= symbol.width;
    });

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 32">\n${symbolsText}\n${useText}</svg>\n`;
}

// convert given string-list to list of symbols, add end if needed
function convertToSymbols(symbols: Symbols): TextSymbol[] {
    const symbolList = symbols.symbols.map(s => findSymbol(symbols.symbolType, s));

    // and end symbol, if first symbol is starting borders
    if(symbolList[0].startsBorders()) {
        symbolList.push(findSymbol(symbols.symbolType, 'END'));
    }

    return symbolList;
}

// split given string to list of symbols, first check if contains single-symbol
// TIE_123 -> [BEGIN, 1, 2, 3]
// LAIVA_VASEN -> [HARBOUR_A]
function findUsedSymbolTexts(text: string): Symbols {
    const singleSymbol = findSingleSymbol(text);

    if(singleSymbol) {
        return {
            symbolType: SymbolType.SINGLE,
            symbols: [singleSymbol]
        }
    }

    let index = 0;
    const symbolList = [] as string[];
    let symbolType = SymbolType.NORMAL;

    while(index < text.length) {
        const mark = text.indexOf('_', index);
        let symbol;
        if(mark !== -1) {
            const symbolText = text.substring(index, mark + 1);
            symbolType = getSymbolType(symbolText.toUpperCase());
            symbol = getSymbol(symbolText.toUpperCase());

            index = mark+1;
        } else {
            symbol = text[index];

            index++;
        }

        if(isValidSymbol(symbolType, symbol)) {
            symbolList.push(symbol);
        } else {
            if(symbolType === SymbolType.NORMAL) {
                error(`${ERROR_INVALID_SYMBOL} ${symbol}`);
            }
            error(`${ERROR_INVALID_SYMBOL} ${symbol} for ${symbolType}`);
        }
    }

    return {
        symbolType: symbolType,
        symbols: symbolList
    };
}

const BEGIN_SYMBOLS = [InputSymbols.ROAD.toString(), InputSymbols.DETOUR.toString(), InputSymbols.DIVERSION.toString()];

function getSymbol(text: string): string {
    if(text === InputSymbols.RAMP) {
        return "RAMPPI_BEGIN";
    } else if(BEGIN_SYMBOLS.includes(text)) {
        return "BEGIN";
    }

    return text;
}

function findSingleSymbol(text: string): string | null {
    const symbol = findSymbol(SymbolType.SINGLE, text.toUpperCase());

    return symbol && symbol.isSingleSymbol() ? text : null;
}

interface Symbols {
    readonly symbolType: SymbolType,
    readonly symbols: string[]
}
