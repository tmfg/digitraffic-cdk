import {findSymbol, InputSymbols, isValidSymbol, Symbol, SymbolType} from "./symbol";
import {getSymbolType} from "../../lib/service/symbol";

const MAX_LENGTH = 30;

function error(errorText: string) {
    throw new Error("ERROR:" + errorText);
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
    if (text.length < 1) error("No content");
    if (text.length > MAX_LENGTH) error("Max length is " + MAX_LENGTH);
}

function checkUnderlines(text: string) {
    const count = text.split('_').length - 1;

    if(count > 1) error("Text can only contain 1 _");
}

// text can be enclosed in brackets, but no more brackets can be used
function checkAndRemoveBrackets(text: string): string {
    const firstChar = text[0];
    const lastChar = text[text.length - 1];

    const count1 = text.split('[').length - 1;
    const count2 = text.split(']').length - 1;

    if(firstChar === '[') {
        // ok, last char must be ]
        if(lastChar !== ']') error("Text must be in form of [text] or text");
        if(count1 > 1 || count2 > 1) error("Text must be in form of [text] or text");

        return text.substring(1, text.length - 1);
    }

    if(count1 > 0 || count2 > 0) error("Text must be in form of [text] or text");

    return text;
}

function convert(text: string): string {
    const symbols = findUsedSymbolTexts(text);
    const symbolList = convertToSymbols(symbols);

    return creteSvg(symbolList);
}

// create svg from symbols
function creteSvg(symbolList: Symbol[]): string {
    // first introduce symbols in svg, only once each
    const symbolsText = Array.from(new Set(symbolList).values()).map((s) => s.getSvg()).join('\n');

    let useText = '';
    let width= 0;

    // then use introduced symbols
    symbolList.forEach((symbol: Symbol) => {
        useText+= `<use href="#${symbol.name}" x="${width}" y="0" width="${symbol.width}" height="32"/>\n`;
        width+= symbol.width;
    });

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 32">\n${symbolsText}\n${useText}</svg>\n`;
}

// convert given string-list to list of symbols, add end if needed
function convertToSymbols(symbols: Symbols): Symbol[] {
//    console.info("symbols " + symbols);

    const symbolList = symbols.symbols.map(s => findSymbol(symbols.symbolType, s));

//    console.info("first type " + JSON.stringify(symbolList[0]));

    // and end symbol, if first symbol is starting borders
    if(symbolList[0].startsBorders()) symbolList.push(findSymbol(symbols.symbolType, 'END'));

    return symbolList;
}

// split given string to list of symbols, first check if contains single-symbol
// TIE_123 -> [BEGIN, 1, 2, 3]
// LAIVA_VASEN -> [HARBOUR_A]
function findUsedSymbolTexts(text: string): Symbols {
    const singleSymbol = findSingleSymbol(text);

    if(singleSymbol) return {
        symbolType: SymbolType.SINGLE,
        symbols: [singleSymbol]
    }

    let index = 0;
    let symbolList = [] as string[];
    let symbolType = SymbolType.NORMAL;

    while(index < text.length) {
        const mark = text.indexOf('_', index);
        let symbol;
        if(mark != -1) {
            const symbolText = text.substring(index, mark + 1);
            symbolType = getSymbolType(symbolText.toUpperCase());
            symbol = getSymbol(symbolText.toUpperCase());

            index = mark+1;
        } else {
            symbol = text[index];

            index++;
        }

        if(isValidSymbol(symbolType, symbol)) {
//            console.info("adding symbol " + symbol);

            symbolList.push(symbol);
        } else {
            throw error("invalid symbol " + symbol + " for " + symbolType);
        }
    }

    return {
        symbolType: symbolType,
        symbols: symbolList
    };
}

const BEGIN_SYMBOLS = [InputSymbols.ROAD.toString(), InputSymbols.DETOUR.toString(), InputSymbols.DIVERSION.toString()];

function getSymbol(text: string): string {
    if(text === InputSymbols.RAMP) return "RAMPPI_BEGIN";
    if(BEGIN_SYMBOLS.includes(text)) return "BEGIN";

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