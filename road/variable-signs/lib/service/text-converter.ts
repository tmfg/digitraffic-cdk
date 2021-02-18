import {findSymbol, isValidSymbol, Symbol} from "./symbol";
import {getBorderType} from "../../lib/service/symbol";

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
        if(lastChar !== ']') error("Text must be in form of [text]");
        if(count1 > 1 || count2 > 1) error("Text must be in form of [text]");

        return text.substring(1, text.length - 1);
    }

    if(count1 > 0 || count2 > 0) error("Text must be in form of [text]");

    return text;
}

function convert(text: string): string {
    const symbolList = findUsedSymbolTexts(text);
    const symbols = convertToSymbols(symbolList);

    return creteSvg(symbols);
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
function convertToSymbols(symbols: string[]): Symbol[] {
    const borderType = getBorderType(symbols[0]);
    const symbolList = symbols.map(s => findSymbol(borderType, s));

    // and end symbol, if first symbol is starting borders
    if(symbolList[0].startsBorders) symbolList.push(findSymbol(borderType, 'END'));

    return symbolList;
}

// split given string to list of symbols
// TIE_123 -> [TIE_BEGIN, 1, 2, 3]
function findUsedSymbolTexts(text: string): string[] {
    let index = 0;
    let symbolList = [] as string[];
    
    while(index < text.length) {
        const mark = text.indexOf('_', index);
        let symbol;
        if(mark != -1) {
            symbol = text.substring(index, mark).toUpperCase() + "_BEGIN";

            index = mark+1;
        } else {
            symbol = text[index];

            index++;
        }

        if(isValidSymbol(symbol)) {
            symbolList.push(symbol);
        } else {
            throw error("invalid symbol " + symbol);
        }
    }

    return symbolList;
}