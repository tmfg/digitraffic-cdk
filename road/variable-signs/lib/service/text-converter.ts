import {findSymbol, isValidSymbol, Symbol, BorderType} from "./symbol";

const MAX_LENGTH = 30;

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
    if (text.length < 1) throw new Error("No content");
    if (text.length > MAX_LENGTH) throw new Error("Max length is " + MAX_LENGTH);
}

function checkUnderlines(text: string) {
    const count = text.split('_').length - 1;

    if(count > 1) throw new Error("Text can only contain 1 _");
}

// text can be enclosed in brackets, but no more brackets can be used
function checkAndRemoveBrackets(text: string): string {
    const firstChar = text[0];
    const lastChar = text[text.length - 1];

    const count1 = text.split('[').length - 1;
    const count2 = text.split(']').length - 1;

    if(firstChar === '[') {
        // ok, last char must be ]
        if(lastChar !== ']') throw new Error("Text must be in form of [text]");
        if(count1 > 1 || count2 > 1) throw new Error("Text must be in form of [text]");

        return text.substring(1, text.length - 1);
    }

    if(count1 > 0 || count2 > 0) throw new Error("Text must be in form of [text]");

    return text;
}

function convert(text: string): string {
    const symbolList = findUsedSymbolTexts(text);
    const symbols = convertToSymbols(symbolList);

    return mergeSymbols(symbols);
}

function mergeSymbols(symbolList: Symbol[]): string {
    let symbolsText= '';

    // first introduce symbols in svg, only once
    new Set(symbolList).forEach((symbol: Symbol) => {
        symbolsText+= symbol.getSvg() + '\n';
    });

    let useText = '';
    let width= 0;

    // then use introduced symbols
    symbolList.forEach((symbol: Symbol) => {
        useText+= `<use href="#${symbol.name}" x="${width}" y="0" width="${symbol.width}" height="32"/>\n`;
        width+= symbol.width;
    });

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 32">\n${symbolsText}\n${useText}</svg>\n`;
}

function getBorderType(first: string): BorderType {
    if(first === 'TIE_BEGIN') return BorderType.TIE;
    if(first === 'VARATIE_BEGIN') return BorderType.VARATIE;
    if(first === 'VARAREITTI_BEGIN') return BorderType.VARAREITTI;

    return BorderType.NONE;
}

function convertToSymbols(symbols: string[]): Symbol[] {
    const borderType = getBorderType(symbols[0]);

    const symbolList = symbols.map(s => findSymbol(borderType, s));

    // and end symbol, if first symbol is beginning
    if(symbolList[0].begins) symbolList.push(findSymbol(borderType, 'END'));

    return symbolList;
}

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
            throw new Error("invalid symbol " + symbol);
        }
    }

    return symbolList;
}