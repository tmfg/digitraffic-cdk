const SYMBOL_CACHE = {} as Record<string, TextSymbol>;

// these will be used in ids
export enum SymbolType {
    NORMAL= "",
    ROAD = "ROAD_",
    DETOUR = "DETOUR_",
    DIVERSION = "DIVERSION_",
    SINGLE = "SINGLE_",
}

// these are symbols used in the input text
export enum InputSymbols {
    ROAD = "TIE_",
    DETOUR = "VARATIE_",
    DIVERSION = "VARAREITTI_",
    RAMP = "RAMPPI_"
}

export class TextSymbol {
    public width: number;
    public svg: string;
    public name: string;
    public symbolType: SymbolType;

    constructor(width: number, svg: string, name: string, symbolType: SymbolType) {
        this.width = width;
        this.svg = svg;
        this.name = name;
        this.symbolType = symbolType;
    }

    startsBorders(): boolean {
        return [SymbolType.ROAD, SymbolType.DETOUR, SymbolType.DIVERSION].includes(this.symbolType);
    }

    isSingleSymbol(): boolean {
        return this.symbolType === SymbolType.SINGLE;
    }

    getSvg(): string {
        return `<symbol id="${this.name}" width="${this.width}" height="32" viewBox="0 0 ${this.width} 32">\n${this.svg}\n</symbol>`;
    }
}

const END = 'END';
const BEGIN = 'BEGIN';

// start/end symbols
addEnd(
    END, 5, '<polygon points="4,31 0,31 0,29 2,29 2,3 0,3 0,1 4,1"/>', SymbolType.ROAD + END, SymbolType.ROAD,
);
addEnd(
    END, 5, `<path d="M1,31H3V29H1ZM1,1V3H3V1ZM1,19H3V17H1Zm0,8H3V25H1Zm0-4H3V21H1Zm0-8H3V13H1ZM1,7H3V5H1Zm0,4H3V9H1Z"/>`, SymbolType.DIVERSION + END, SymbolType.DIVERSION,
);
addEnd(
    END, 5, `<polygon points="0 1 4 1 4 6.5 2 6.5 2 3 0 3 0 1"/>
<path d="M2,9.682H4v4.227H2Zm0,8.409H4v4.227H2Z"/>
<polygon points="2 25.5 4 25.5 4 31 0 31 0 29 2 29 2 25.5"/>`, SymbolType.DETOUR + END, SymbolType.DETOUR,
);

addEnd(
    BEGIN, 5, `<polygon points="5,31 1,31 1,1 5,1 5,3 3,3 3,29 5,29 "/>`, SymbolType.ROAD + BEGIN, SymbolType.ROAD,
);
addEnd(
    BEGIN, 5, `<path d="M2,31H4V29H2ZM2,1V3H4V1ZM2,19H4V17H2Zm0,8H4V25H2Zm0-4H4V21H2Zm0-8H4V13H2ZM2,7H4V5H2Zm0,4H4V9H2Z"/>`, SymbolType.DIVERSION + BEGIN, SymbolType.DIVERSION,
);
addEnd(
    BEGIN, 5, `<polygon points="5 31 1 31 1 25.5 3 25.5 3 29 5 29 5 31"/>
<path d="M3,22.318H1V18.091H3Zm0-8.409H1V9.682H3Z"/>
<polygon points="3 6.5 1 6.5 1 1 5 1 5 3 3 3 3 6.5"/>`, SymbolType.DETOUR + BEGIN, SymbolType.DETOUR,
);

addEnd(
    'RAMP', 30, `<polygon points="5.1,26 11.7,26 13.4,6 10.7,6"/>
<polygon points="23.1,26 16.4,26 14.8,6 17.4,6"/>
<polygon points="27.8,11.8 22,6 27.8,6"/>
<path d="M16.2,21.2c0-5.2,1.8-8.6,4.5-10.6l5-3.7L26.9,8l-3.8,4.5c-1.4,1.8-2.3,4.3-1.6,8L16.2,21.2z"/>
<polygon points="30,31 1,31 1,1 30,1 30,3 3,3 3,29 30,29"/>`, SymbolType.ROAD + InputSymbols.RAMP + BEGIN, SymbolType.ROAD,
);

// numbers
addSymbol('n1', 16, `<path d="M11.3,25.4H7.4V14.7l0-1.8L7.5,11c-0.7,0.7-1.1,1.1-1.4,1.3L4,14l-1.9-2.4l6-4.8h3.2V25.4z"/>`, '1');
addSymbol('n2', 16, `<path d="M14.6,25.4h-13v-2.7L6.3,18c1.4-1.4,2.3-2.4,2.7-2.9s0.7-1.1,0.9-1.5s0.3-0.9,0.3-1.4c0-0.7-0.2-1.3-0.6-1.7
c-0.4-0.4-1-0.5-1.6-0.5c-0.7,0-1.4,0.2-2.1,0.5s-1.4,0.8-2.1,1.4L1.6,9.3c0.9-0.8,1.7-1.3,2.3-1.7s1.3-0.6,2-0.7s1.5-0.3,2.4-0.3
c1.2,0,2.2,0.2,3.1,0.6s1.6,1,2.1,1.8s0.7,1.6,0.7,2.6c0,0.9-0.2,1.7-0.5,2.4c-0.3,0.7-0.8,1.5-1.4,2.3c-0.6,0.8-1.7,1.9-3.3,3.4
L6.5,22v0.2h8.1V25.4z"/>`, '2');
addSymbol('n3', 16, `<path d="M13.9,11c0,1.2-0.4,2.1-1.1,3s-1.7,1.4-3,1.7v0.1c1.5,0.2,2.6,0.6,3.4,1.4c0.8,0.7,1.2,1.7,1.2,2.9c0,1.8-0.6,3.2-1.9,4.2
c-1.3,1-3.1,1.5-5.5,1.5c-2,0-3.8-0.3-5.4-1v-3.3c0.7,0.4,1.5,0.7,2.4,0.9s1.7,0.3,2.6,0.3c1.3,0,2.3-0.2,2.9-0.7s0.9-1.1,0.9-2.1
c0-0.9-0.4-1.5-1.1-1.9s-1.8-0.5-3.4-0.5H4.4v-3h1.4c1.4,0,2.5-0.2,3.2-0.6c0.7-0.4,1-1,1-1.9c0-1.4-0.9-2.1-2.6-2.1
c-0.6,0-1.2,0.1-1.9,0.3c-0.6,0.2-1.3,0.6-2.1,1.1L1.6,8.4c1.7-1.2,3.7-1.8,6.1-1.8c1.9,0,3.4,0.4,4.6,1.2
C13.3,8.6,13.9,9.6,13.9,11z"/>`, '3');
addSymbol('n4', 16, `<path d="M15,21.6h-2.2v3.8H8.9v-3.8H1v-2.7l8.1-12h3.6v11.7H15V21.6z M8.9,18.5v-3.1c0-0.5,0-1.3,0.1-2.3s0.1-1.6,0.1-1.7H9
c-0.3,0.7-0.7,1.4-1.1,2l-3.4,5.1H8.9z"/>`, '4');
addSymbol('n5', 16, `<path d="M8.4,13.6c1.8,0,3.2,0.5,4.3,1.5c1.1,1,1.6,2.4,1.6,4.1c0,2.1-0.6,3.7-1.9,4.8s-3.1,1.7-5.5,1.7c-2.1,0-3.7-0.3-5-1v-3.4
c0.7,0.4,1.4,0.6,2.3,0.9c0.9,0.2,1.7,0.3,2.5,0.3c2.4,0,3.6-1,3.6-2.9c0-1.9-1.2-2.8-3.7-2.8c-0.4,0-0.9,0-1.5,0.1s-1,0.2-1.3,0.3
l-1.6-0.8l0.7-9.5H13v3.3H6.4L6,13.8l0.4-0.1C7,13.6,7.6,13.6,8.4,13.6z"/>`, '5');
addSymbol('n6', 16, `<path d="M1.5,17.5c0-3.7,0.8-6.4,2.3-8.2c1.6-1.8,3.9-2.7,7-2.7c1.1,0,1.9,0.1,2.5,0.2V10c-0.8-0.2-1.5-0.3-2.2-0.3
c-1.3,0-2.4,0.2-3.3,0.6c-0.9,0.4-1.5,1-1.9,1.8s-0.7,1.9-0.7,3.4h0.2c0.8-1.4,2.2-2.2,4-2.2c1.7,0,3,0.5,3.9,1.6s1.4,2.5,1.4,4.3
c0,2-0.6,3.5-1.7,4.7c-1.1,1.2-2.7,1.7-4.6,1.7c-1.4,0-2.6-0.3-3.6-1c-1-0.6-1.8-1.6-2.4-2.8C1.8,20.7,1.5,19.3,1.5,17.5z
 M8.2,22.5c0.8,0,1.5-0.3,1.9-0.8c0.4-0.6,0.7-1.4,0.7-2.4c0-0.9-0.2-1.6-0.6-2.1c-0.4-0.5-1.1-0.8-1.9-0.8c-0.8,0-1.5,0.3-2,0.8
c-0.6,0.5-0.8,1.1-0.8,1.8c0,1,0.3,1.9,0.8,2.6C6.7,22.2,7.4,22.5,8.2,22.5z"/>`, '6');
addSymbol('n7', 16, `<path d="M3.5,25.4l7-15.2H1.3V6.9h13.3v2.5l-7,16.1H3.5z"/>`, '7');
addSymbol('n8', 16, `<path d="M8,6.6c1.8,0,3.2,0.4,4.3,1.2c1.1,0.8,1.6,1.9,1.6,3.3c0,0.9-0.3,1.8-0.8,2.5s-1.4,1.4-2.5,2c1.4,0.7,2.4,1.5,3,2.3
\t\tc0.6,0.8,0.9,1.7,0.9,2.7c0,1.5-0.6,2.7-1.8,3.7c-1.2,0.9-2.8,1.4-4.7,1.4c-2,0-3.6-0.4-4.8-1.3s-1.7-2.1-1.7-3.7
\t\tc0-1.1,0.3-2,0.8-2.8c0.6-0.8,1.5-1.5,2.7-2.2c-1.1-0.7-1.8-1.4-2.3-2.1S2.1,12,2.1,11.1c0-1.3,0.5-2.4,1.7-3.2S6.2,6.6,8,6.6z
\t\t M5.1,20.5c0,0.7,0.3,1.3,0.8,1.7s1.2,0.6,2.1,0.6c1,0,1.7-0.2,2.2-0.6c0.5-0.4,0.7-1,0.7-1.7c0-0.6-0.2-1.1-0.7-1.6
\t\tc-0.5-0.5-1.3-1-2.3-1.6C6,18.2,5.1,19.2,5.1,20.5z M8,9.5c-0.7,0-1.2,0.2-1.6,0.5c-0.4,0.3-0.6,0.8-0.6,1.4c0,0.5,0.2,1,0.5,1.4
\t\tC6.6,13.2,7.2,13.6,8,14c0.8-0.4,1.4-0.8,1.7-1.2s0.5-0.9,0.5-1.4c0-0.6-0.2-1-0.6-1.4S8.7,9.5,8,9.5z"/>`,'8');
addSymbol('n9', 16, `<path d="M14.5,14.8c0,3.7-0.8,6.4-2.3,8.2s-3.9,2.7-7,2.7c-1.1,0-1.9-0.1-2.5-0.2v-3.1c0.7,0.2,1.5,0.3,2.2,0.3
\t\tc1.3,0,2.4-0.2,3.2-0.6c0.8-0.4,1.5-1,1.9-1.8c0.4-0.8,0.7-2,0.8-3.4h-0.2c-0.5,0.8-1.1,1.4-1.7,1.7S7.6,19,6.6,19
\t\tc-1.6,0-2.9-0.5-3.8-1.6c-0.9-1-1.4-2.5-1.4-4.3c0-2,0.6-3.6,1.7-4.7c1.1-1.2,2.7-1.7,4.6-1.7c1.4,0,2.6,0.3,3.6,1
\t\tc1,0.6,1.8,1.6,2.4,2.8S14.5,13.1,14.5,14.8z M7.8,9.8c-0.8,0-1.4,0.3-1.9,0.8S5.2,12,5.2,13.1c0,0.9,0.2,1.6,0.6,2.1
\t\ts1,0.8,1.9,0.8c0.8,0,1.5-0.3,2-0.8s0.9-1.1,0.9-1.8c0-1-0.3-1.9-0.8-2.6C9.3,10.2,8.6,9.8,7.8,9.8z"/>`, '9');
addSymbol('n0', 16, `<path d="M14.5,16.2c0,3.2-0.5,5.6-1.6,7.2c-1.1,1.6-2.7,2.3-4.9,2.3c-2.1,0-3.8-0.8-4.8-2.4c-1.1-1.6-1.6-4-1.6-7.1
\t\tc0-3.3,0.5-5.7,1.6-7.2S5.8,6.6,8,6.6c2.1,0,3.8,0.8,4.9,2.4C13.9,10.6,14.5,13,14.5,16.2z M5.4,16.2c0,2.3,0.2,3.9,0.6,4.9
\t\tc0.4,1,1.1,1.5,2,1.5c0.9,0,1.6-0.5,2-1.5s0.6-2.6,0.6-4.9c0-2.3-0.2-3.9-0.6-4.9c-0.4-1-1.1-1.5-2-1.5c-0.9,0-1.6,0.5-2,1.5
\t\tS5.4,13.9,5.4,16.2z"/>`, '0');

// alphabets
addSymbol('A', 20, `<path d="M14.7,25.4L13.4,21H6.6l-1.3,4.4H1L7.6,6.8h4.8L19,25.4H14.7z M12.4,17.7c-1.2-4-1.9-6.3-2.1-6.8
\t\t\tc-0.2-0.5-0.3-0.9-0.3-1.2c-0.3,1.1-1.1,3.8-2.4,8H12.4z"/>`);
addSymbol('B', 20, `<path d="M3.6,6.9h5.8c2.6,0,4.5,0.4,5.7,1.1c1.2,0.7,1.8,1.9,1.8,3.6c0,1.1-0.3,2-0.8,2.7c-0.5,0.7-1.2,1.1-2.1,1.3v0.1
\t\t\tc1.2,0.3,2,0.8,2.5,1.5c0.5,0.7,0.8,1.7,0.8,2.9c0,1.7-0.6,3-1.8,4c-1.2,0.9-2.9,1.4-5,1.4H3.6V6.9z M7.5,14.2h2.3
\t\t\tc1.1,0,1.8-0.2,2.3-0.5c0.5-0.3,0.7-0.9,0.7-1.6c0-0.7-0.3-1.2-0.8-1.5c-0.5-0.3-1.3-0.5-2.5-0.5H7.5V14.2z M7.5,17.3v4.8h2.6
\t\t\tc1.1,0,1.9-0.2,2.4-0.6s0.8-1,0.8-1.9c0-1.5-1.1-2.3-3.3-2.3H7.5z"/>`);
addSymbol('C', 20, `<defs>
    <style>.cls-1{font-size:26px;font-family:OpenSans-Bold, Open Sans;font-weight:700;}</style>
</defs>
<text class="cls-1" transform="translate(1.716 25.432)">C</text>`);
addSymbol('D', 20, `<defs>
    <style>.cls-1{font-size:26px;font-family:OpenSans-Bold, Open Sans;font-weight:700;}</style>
</defs>
<text class="cls-1" transform="translate(0.377 25.432)">D</text>`);
addSymbol('E', 20, `<path d="M11.7,25.4H4.1V6.9h10.7v3.2H8v4.1h6.3v3.2H8v4.8h6.8V25.4z"/>`);
addSymbol('F', 20, `<path d="M1.7,25.4H4.1V6.9h10.7v3.2H8v4.1h6.3v3.2H8v4.8V25.4z"/>`);

// other symbols
addSingle('HARBOUR', 48, `<polygon points="14.5,19 18.8,8.7 24,10.6 24,13.8 21.9,13.8 21.9,16.6 27,16.6 27,13.8 24.8,13.8 24.8,9.8 17.6,6 9.8,19"/>
   <polygon points="37.7,19.3 37.7,15.6 34.7,15.6 33,19.3"/>
   <polygon points="38.6,25.2 38.6,20 32.6,20 31.1,21.8 16.2,21.8 14.4,19.9 7.8,19.9 10,25.2"/>
   <path d="M7.9,25l3.6,1l3.6-0.8l3.7,0.6l3.7-0.6l4.1,0.8l4.7-0.9l3.8,0.9l4.9-0.8l0.2-0.8l-5,0.7l-3.8-0.8l-4.7,0.8l-4.1-0.7
\t\t\tc-2.5,0.7-4.3,0.8-5.5,0.4c-1.2-0.3-3.1-0.2-5.4,0.4l-3.6-0.9V25z"/>
   <path d="M47,31H1V1h46V31z M3,29h42V3H3V29z"/>`, 'LAIVA_VASEN');
addSingle('HARBOUR', 48, `<polygon points="38.2,19 30.4,6 23.2,9.8 23.2,13.8 21,13.8 21,16.6 26.1,16.6 26.1,13.8 24,13.8 24,10.6 29.2,8.7 33.5,19 \t\t"/>
   <polygon points="15,19.3 13.3,15.6 10.3,15.6 10.3,19.3 \t\t"/>
   <polygon points="38,25.2 40.2,19.9 33.6,19.9 31.8,21.8 16.9,21.8 15.4,20 9.4,20 9.4,25.2 \t\t"/>
   <path d="M40.1,24.3l-3.6,0.9c-2.4-0.6-4.2-0.7-5.4-0.4c-1.2,0.4-3.1,0.2-5.5-0.4l-4.1,0.7l-4.7-0.8l-3.8,0.8l-5-0.7L8,25.2
\t\t\tl4.9,0.8l3.8-0.9l4.7,0.9l4.1-0.8l3.7,0.6l3.7-0.6l3.6,0.8l3.6-1V24.3z"/>
   <path d="M47,31H1V1h46V31z M3,29h42V3H3V29z"/>`, 'LAIVA_OIKEA');
addSingle('RAMP', 48, `<path d="M47,31H1V1h46V31z M3,29h42V3H3V29z"/>
   <polygon points="12.6,26 19.3,26 21,6 18.3,6"/>
   <polygon points="30.6,26 24,26 22.3,6 25,6"/>
   <polygon points="35.4,11.8 29.5,6 35.4,6"/>
   <path d="M23.8,21.2c0-5.2,1.8-8.6,4.5-10.6l5-3.7L34.4,8l-3.8,4.5c-1.4,1.8-2.3,4.3-1.6,8L23.8,21.2z"/>`, 'RAMPPI');
addSingle('AIRPORT', 48, `<path d="M25.8,12.2L29.2,5h-1.6c-0.5,0-1,0.2-1.3,0.6L21,12.2H25.8z"/>
   <path d="M32.9,18.3h-20c-2.2,0-3.4-0.4-4.1-0.9C8,16.8,8,16.3,8.9,15.3c1.1-1.2,2.8-2,4.5-2h21.4l2.5-3.3c0.3-0.3,0.7-0.5,1.2-0.5
\t\t\th1.4L37,16C36.5,17.1,34.9,18.3,32.9,18.3z"/>
   <path d="M29.2,27h-1.6c-0.5,0-1-0.2-1.3-0.6L19.5,18h5.4L29.2,27z"/>
   <path d="M47,31H1V1h46V31z M3,29h42V3H3V29z"/>`, 'LENTOKONE_VASEN');
addSingle('AIRPORT', 48, `<path d="M22.2,12.2L18.8,5h1.6c0.5,0,1,0.2,1.3,0.6l5.3,6.5H22.2z"/>
   <path d="M15.1,18.3h20c2.2,0,3.4-0.4,4.1-0.9c0.8-0.6,0.8-1.1-0.1-2.1c-1.1-1.2-2.8-2-4.5-2H13.3l-2.5-3.3
\t\t\tC10.4,9.8,10,9.7,9.6,9.7H8.2L11,16C11.5,17.1,13.1,18.3,15.1,18.3z"/>
   <path d="M18.8,27h1.6c0.5,0,1-0.2,1.3-0.6l6.8-8.3h-5.4L18.8,27z"/>
   <path d="M47,31H1V1h46V31z M3,29h42V3H3V29z"/>`, 'LENTOKONE_OIKEA');
addSingle('AIRPORT', 48, `<path d="M18.9,24.2l17.3-10c1.9-1.1,2.8-2,3.1-2.8c0.4-0.9,0.2-1.3-1.1-1.7c-1.5-0.5-3.4-0.3-4.9,0.5L14.8,20.8L11,19.3
\t\t\tc-0.4-0.1-0.9,0-1.3,0.2l-1.2,0.7l5.6,4.1C15.1,25,17.1,25.2,18.9,24.2z"/>
   <path d="M24.6,20.6l-13.6-9.3l1.6-0.9c0.5-0.3,1.2-0.4,1.8-0.1l17.1,6.4L24.6,20.6z"/>
   <path d="M47,31H1V1h46V31z M3,29h42V3H3V29z"/>`, 'LENTOKONE_YLOS');
addSingle('AIRPORT', 48, `<path d="M47,31H1V1h46V31z M3,29h42V3H3V29z"/>
   <path d="M13.9,19.4l18.8,6.8c2.1,0.7,3.3,0.8,4.2,0.6c1-0.3,1.1-0.7,0.6-2c-0.6-1.5-2-2.8-3.5-3.4l-20.1-7.3l-1.3-3.9
\t\t\tc-0.2-0.4-0.5-0.7-1-0.9l-1.3-0.5l0.5,6.9C10.9,17,11.9,18.7,13.9,19.4z"/>
   <path d="M20.3,21.5L18.8,5.1l1.8,0.6c0.6,0.2,1.1,0.7,1.3,1.3l6.1,17.2L20.3,21.5z"/>`, 'LENTOKONE_ALAS');
addSingle('ARROW_LEFT', 32, `<rect x="10" y="14" width="18" height="4"/>
   <polygon points="10,22 4,16 10,10"/>`, 'NUOLI_VASEN');
addSingle('ARROW_RIGHT', 32, `<rect x="4" y="14" width="18" height="4"/>
   <polygon points="22,10 28,16 22,22 \t"/>`, 'NUOLI_OIKEA');
addSingle('ARROW_UP', 32, `<rect x="14" y="10" width="4" height="18"/>
   <polygon points="10,10 16,4 22,10 \t"/>`, 'NUOLI_YLOS');
addSingle('ARROW_DOWN', 32, `<rect x="14" y="4" width="4" height="18"/>
   <polygon points="22,22 16,28 10,22"/>`, 'NUOLI_ALAS');

addSingle('ARROW_TOP_LEFT', 32, `<rect x="9.1" y="16.1" transform="matrix(0.7071 0.7071 -0.7071 0.7071 18.1219 -7.5063)" width="18" height="4"/>
   <polygon points="7.5,16 7.5,7.5 16,7.5"/>`, 'NUOLI_VASENYLOS');
addSingle('ARROW_TOP_RIGHT', 32, `<rect x="11.9" y="9.1" transform="matrix(0.7071 0.7071 -0.7071 0.7071 16.8787 -4.5061)" width="4" height="18"/>
   <polygon points="16,7.5 24.5,7.5 24.5,16"/>`, 'NUOLI_OIKEAYLOS');
addSingle('ARROW_BOTTOM_LEFT', 32, `<rect x="16.1" y="4.9" transform="matrix(0.7071 0.7071 -0.7071 0.7071 15.1212 -8.749)" width="4" height="18"/>
   <polygon points="16,24.5 7.5,24.5 7.5,16"/>`, 'NUOLI_VASENALAS');
addSingle('ARROW_BOTTOM_RIGHT', 32, `<rect x="4.9" y="11.9" transform="matrix(0.7071 0.7071 -0.7071 0.7071 13.8781 -5.7488)" width="18" height="4"/>
   <polygon points="24.5,16 24.5,24.5 16,24.5"/>`, 'NUOLI_OIKEAALAS');

export function getSymbolType(first: string): SymbolType {
    switch (first) {
        case InputSymbols.ROAD:
            return SymbolType.ROAD;
        case InputSymbols.DETOUR:
            return SymbolType.DETOUR;
        case InputSymbols.DIVERSION:
            return SymbolType.DIVERSION;
        case InputSymbols.RAMP:
            return SymbolType.ROAD;
        default:
            return SymbolType.NORMAL;
    }
}

// put all versions of symbol to cache with correct borders:
// ID               symbol without borders
// ROAD_ID          symbol with solid borders
// VARATIE_ID       symbol with varatie borders
// DIVERSION_ID     symbol with diversion borders
function addSymbol(name: string, width: number, svg: string, id: string = name) {
    const tieSvg = svg + `\n<rect y="1" width="${width}" height="2"/>\n<rect y="29" width="${width}" height="2"/>`;
    const varatieSvg = svg + `\n<rect y="1" width="2" height="2"/>
    <rect x="5.6" y="1" width="4.8" height="2"/>
    <rect x="14" y="1" width="2" height="2"/>
    <rect y="29" width="2" height="2"/>
    <rect x="5.6" y="29" width="4.8" height="2"/>
    <rect x="14" y="29" width="2" height="2"/>`;

    // alphabets are widers, need different svg for varareitti
    const varareittiSvg = svg + (width === 16 ? '\n<path d="M1.006,3h2V1h-2Zm4,0h2V1h-2Zm4,0h2V1h-2Zm4-2V3h2V1Zm-12,30h2V29h-2Zm4,0h2V29h-2Zm4,0h2V29h-2Zm4,0h2V29h-2Z"/>'
        : '<path d="M1.006,3h2V1h-2Zm4,0h2V1h-2Zm4,0h2V1h-2Zm4,0h2V1h-2Zm4-2V3h2V1Zm-16,30h2V29h-2Zm4,0h2V29h-2Zm4,0h2V29h-2Zm4,0h2V29h-2Zm4,0h2V29h-2Z"/>');

    SYMBOL_CACHE[id] = new TextSymbol(width, svg, name, SymbolType.NORMAL);
    SYMBOL_CACHE[SymbolType.ROAD + id] = new TextSymbol(width, tieSvg, name, SymbolType.ROAD);
    SYMBOL_CACHE[SymbolType.DETOUR + id] = new TextSymbol(width, varatieSvg, name, SymbolType.DETOUR);
    SYMBOL_CACHE[SymbolType.DIVERSION + id] = new TextSymbol(width, varareittiSvg, name, SymbolType.DIVERSION);
}

function addSingle(name: string, width: number, svg: string, id: string = name) {
    SYMBOL_CACHE[SymbolType.SINGLE + id] = new TextSymbol(width, svg, name, SymbolType.SINGLE);
}

function addEnd(
    name: string, width: number, svg: string, id: string, symbolType: SymbolType,
) {
    SYMBOL_CACHE[id] = new TextSymbol(width, svg, name, symbolType);
}

export function findSymbol(symbolType: SymbolType, name: string): TextSymbol {
    const symbolKey = symbolType + name.toUpperCase();

    return SYMBOL_CACHE[symbolKey];
}

export function isValidSymbol(symbolType: SymbolType, symbol: string): boolean {
    return (symbolType + symbol.toUpperCase()) in SYMBOL_CACHE;
}
