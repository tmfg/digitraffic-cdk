const SYMBOL_CACHE = {} as any;

// these will be used in ids
export enum BorderType {
    NONE= "",
    ROAD = "ROAD_",
    DETOUR = "DETOUR_",
    DIVERSION = "DIVERSION_"
}

// these are in the input text
enum SymbolType {
    ROAD = "TIE_",
    DETOUR = "VARATIE_",
    DIVERSION = "VARAREITTI_",
    RAMP = "RAMPPI_"
}

export class Symbol {
    public width: number;
    public svg: string;
    public name: string;
    public id: string;
    public startsBorders: boolean;

    constructor(width: number, svg: string, name: string, id: string, startsBorders: boolean) {
        this.width = width;
        this.svg = svg;
        this.name = name;
        this.id = id;
        this.startsBorders = startsBorders;
    }

    getSvg(): string {
        return `<symbol id="${this.name}" width="${this.width}" height="32">\n${this.svg}\n</symbol>`;
    }
}

const END = 'END';
const BEGIN = 'BEGIN';

// start/end symbols
addEnd(END, 5, '<polygon points="4,31 0,31 0,29 2,29 2,3 0,3 0,1 4,1"/>', BorderType.ROAD + END);
addEnd(END, 5, `<path d="M1,31H3V29H1ZM1,1V3H3V1ZM1,19H3V17H1Zm0,8H3V25H1Zm0-4H3V21H1Zm0-8H3V13H1ZM1,7H3V5H1Zm0,4H3V9H1Z"/>`, BorderType.DIVERSION + END);
addEnd(END, 5, `<polygon points="0 1 4 1 4 6.5 2 6.5 2 3 0 3 0 1"/>
<path d="M2,9.682H4v4.227H2Zm0,8.409H4v4.227H2Z"/>
<polygon points="2 25.5 4 25.5 4 31 0 31 0 29 2 29 2 25.5"/>`, BorderType.DETOUR + END);

addEnd(BEGIN, 5, `<polygon points="5,31 1,31 1,1 5,1 5,3 3,3 3,29 5,29 "/>`, SymbolType.ROAD + BEGIN);
addEnd(BEGIN, 5, `<path d="M2,31H4V29H2ZM2,1V3H4V1ZM2,19H4V17H2Zm0,8H4V25H2Zm0-4H4V21H2Zm0-8H4V13H2ZM2,7H4V5H2Zm0,4H4V9H2Z"/>`, SymbolType.DIVERSION + BEGIN);
addEnd(BEGIN, 5, `<polygon points="5 31 1 31 1 25.5 3 25.5 3 29 5 29 5 31"/>
<path d="M3,22.318H1V18.091H3Zm0-8.409H1V9.682H3Z"/>
<polygon points="3 6.5 1 6.5 1 1 5 1 5 3 3 3 3 6.5"/>`, SymbolType.DETOUR + BEGIN)

addEnd('RAMP', 30, `<polygon points="5.1,26 11.7,26 13.4,6 10.7,6"/>
<polygon points="23.1,26 16.4,26 14.8,6 17.4,6"/>
<polygon points="27.8,11.8 22,6 27.8,6"/>
<path d="M16.2,21.2c0-5.2,1.8-8.6,4.5-10.6l5-3.7L26.9,8l-3.8,4.5c-1.4,1.8-2.3,4.3-1.6,8L16.2,21.2z"/>
<polygon points="30,31 1,31 1,1 30,1 30,3 3,3 3,29 30,29"/>`, SymbolType.RAMP + BEGIN);

// numbers
addSymbol('1', 16, `<path d="M11.3,25.4H7.4V14.7l0-1.8L7.5,11c-0.7,0.7-1.1,1.1-1.4,1.3L4,14l-1.9-2.4l6-4.8h3.2V25.4z"/>`, '1');
addSymbol('2', 16, `<path d="M14.6,25.4h-13v-2.7L6.3,18c1.4-1.4,2.3-2.4,2.7-2.9s0.7-1.1,0.9-1.5s0.3-0.9,0.3-1.4c0-0.7-0.2-1.3-0.6-1.7
c-0.4-0.4-1-0.5-1.6-0.5c-0.7,0-1.4,0.2-2.1,0.5s-1.4,0.8-2.1,1.4L1.6,9.3c0.9-0.8,1.7-1.3,2.3-1.7s1.3-0.6,2-0.7s1.5-0.3,2.4-0.3
c1.2,0,2.2,0.2,3.1,0.6s1.6,1,2.1,1.8s0.7,1.6,0.7,2.6c0,0.9-0.2,1.7-0.5,2.4c-0.3,0.7-0.8,1.5-1.4,2.3c-0.6,0.8-1.7,1.9-3.3,3.4
L6.5,22v0.2h8.1V25.4z"/>`, '2');
addSymbol('3', 16, `<path d="M13.9,11c0,1.2-0.4,2.1-1.1,3s-1.7,1.4-3,1.7v0.1c1.5,0.2,2.6,0.6,3.4,1.4c0.8,0.7,1.2,1.7,1.2,2.9c0,1.8-0.6,3.2-1.9,4.2
c-1.3,1-3.1,1.5-5.5,1.5c-2,0-3.8-0.3-5.4-1v-3.3c0.7,0.4,1.5,0.7,2.4,0.9s1.7,0.3,2.6,0.3c1.3,0,2.3-0.2,2.9-0.7s0.9-1.1,0.9-2.1
c0-0.9-0.4-1.5-1.1-1.9s-1.8-0.5-3.4-0.5H4.4v-3h1.4c1.4,0,2.5-0.2,3.2-0.6c0.7-0.4,1-1,1-1.9c0-1.4-0.9-2.1-2.6-2.1
c-0.6,0-1.2,0.1-1.9,0.3c-0.6,0.2-1.3,0.6-2.1,1.1L1.6,8.4c1.7-1.2,3.7-1.8,6.1-1.8c1.9,0,3.4,0.4,4.6,1.2
C13.3,8.6,13.9,9.6,13.9,11z"/>`, '3');
addSymbol('4', 16, `<path d="M15,21.6h-2.2v3.8H8.9v-3.8H1v-2.7l8.1-12h3.6v11.7H15V21.6z M8.9,18.5v-3.1c0-0.5,0-1.3,0.1-2.3s0.1-1.6,0.1-1.7H9
c-0.3,0.7-0.7,1.4-1.1,2l-3.4,5.1H8.9z"/>`, '4');
addSymbol('5', 16, `<path d="M8.4,13.6c1.8,0,3.2,0.5,4.3,1.5c1.1,1,1.6,2.4,1.6,4.1c0,2.1-0.6,3.7-1.9,4.8s-3.1,1.7-5.5,1.7c-2.1,0-3.7-0.3-5-1v-3.4
c0.7,0.4,1.4,0.6,2.3,0.9c0.9,0.2,1.7,0.3,2.5,0.3c2.4,0,3.6-1,3.6-2.9c0-1.9-1.2-2.8-3.7-2.8c-0.4,0-0.9,0-1.5,0.1s-1,0.2-1.3,0.3
l-1.6-0.8l0.7-9.5H13v3.3H6.4L6,13.8l0.4-0.1C7,13.6,7.6,13.6,8.4,13.6z"/>`, '5');
addSymbol('6', 16, `<path d="M1.5,17.5c0-3.7,0.8-6.4,2.3-8.2c1.6-1.8,3.9-2.7,7-2.7c1.1,0,1.9,0.1,2.5,0.2V10c-0.8-0.2-1.5-0.3-2.2-0.3
c-1.3,0-2.4,0.2-3.3,0.6c-0.9,0.4-1.5,1-1.9,1.8s-0.7,1.9-0.7,3.4h0.2c0.8-1.4,2.2-2.2,4-2.2c1.7,0,3,0.5,3.9,1.6s1.4,2.5,1.4,4.3
c0,2-0.6,3.5-1.7,4.7c-1.1,1.2-2.7,1.7-4.6,1.7c-1.4,0-2.6-0.3-3.6-1c-1-0.6-1.8-1.6-2.4-2.8C1.8,20.7,1.5,19.3,1.5,17.5z
 M8.2,22.5c0.8,0,1.5-0.3,1.9-0.8c0.4-0.6,0.7-1.4,0.7-2.4c0-0.9-0.2-1.6-0.6-2.1c-0.4-0.5-1.1-0.8-1.9-0.8c-0.8,0-1.5,0.3-2,0.8
c-0.6,0.5-0.8,1.1-0.8,1.8c0,1,0.3,1.9,0.8,2.6C6.7,22.2,7.4,22.5,8.2,22.5z"/>`, '6');
addSymbol('7', 16, `<path d="M3.5,25.4l7-15.2H1.3V6.9h13.3v2.5l-7,16.1H3.5z"/>`, '7');
addSymbol('8', 16, `<path d="M8,6.6c1.8,0,3.2,0.4,4.3,1.2c1.1,0.8,1.6,1.9,1.6,3.3c0,0.9-0.3,1.8-0.8,2.5s-1.4,1.4-2.5,2c1.4,0.7,2.4,1.5,3,2.3
\t\tc0.6,0.8,0.9,1.7,0.9,2.7c0,1.5-0.6,2.7-1.8,3.7c-1.2,0.9-2.8,1.4-4.7,1.4c-2,0-3.6-0.4-4.8-1.3s-1.7-2.1-1.7-3.7
\t\tc0-1.1,0.3-2,0.8-2.8c0.6-0.8,1.5-1.5,2.7-2.2c-1.1-0.7-1.8-1.4-2.3-2.1S2.1,12,2.1,11.1c0-1.3,0.5-2.4,1.7-3.2S6.2,6.6,8,6.6z
\t\t M5.1,20.5c0,0.7,0.3,1.3,0.8,1.7s1.2,0.6,2.1,0.6c1,0,1.7-0.2,2.2-0.6c0.5-0.4,0.7-1,0.7-1.7c0-0.6-0.2-1.1-0.7-1.6
\t\tc-0.5-0.5-1.3-1-2.3-1.6C6,18.2,5.1,19.2,5.1,20.5z M8,9.5c-0.7,0-1.2,0.2-1.6,0.5c-0.4,0.3-0.6,0.8-0.6,1.4c0,0.5,0.2,1,0.5,1.4
\t\tC6.6,13.2,7.2,13.6,8,14c0.8-0.4,1.4-0.8,1.7-1.2s0.5-0.9,0.5-1.4c0-0.6-0.2-1-0.6-1.4S8.7,9.5,8,9.5z"/>`,'8')
addSymbol('9', 16, `<path d="M14.5,14.8c0,3.7-0.8,6.4-2.3,8.2s-3.9,2.7-7,2.7c-1.1,0-1.9-0.1-2.5-0.2v-3.1c0.7,0.2,1.5,0.3,2.2,0.3
\t\tc1.3,0,2.4-0.2,3.2-0.6c0.8-0.4,1.5-1,1.9-1.8c0.4-0.8,0.7-2,0.8-3.4h-0.2c-0.5,0.8-1.1,1.4-1.7,1.7S7.6,19,6.6,19
\t\tc-1.6,0-2.9-0.5-3.8-1.6c-0.9-1-1.4-2.5-1.4-4.3c0-2,0.6-3.6,1.7-4.7c1.1-1.2,2.7-1.7,4.6-1.7c1.4,0,2.6,0.3,3.6,1
\t\tc1,0.6,1.8,1.6,2.4,2.8S14.5,13.1,14.5,14.8z M7.8,9.8c-0.8,0-1.4,0.3-1.9,0.8S5.2,12,5.2,13.1c0,0.9,0.2,1.6,0.6,2.1
\t\ts1,0.8,1.9,0.8c0.8,0,1.5-0.3,2-0.8s0.9-1.1,0.9-1.8c0-1-0.3-1.9-0.8-2.6C9.3,10.2,8.6,9.8,7.8,9.8z"/>`, '9');
addSymbol('0', 16, `<path d="M14.5,16.2c0,3.2-0.5,5.6-1.6,7.2c-1.1,1.6-2.7,2.3-4.9,2.3c-2.1,0-3.8-0.8-4.8-2.4c-1.1-1.6-1.6-4-1.6-7.1
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

export function getBorderType(first: string): BorderType {
    if(first === SymbolType.ROAD + BEGIN) return BorderType.ROAD;
    if(first === SymbolType.DETOUR + BEGIN) return BorderType.DETOUR;
    if(first === SymbolType.DIVERSION + BEGIN) return BorderType.DIVERSION;
    if(first === SymbolType.RAMP + BEGIN) return BorderType.ROAD;

    return BorderType.NONE;
}

// put all versions of symbol to cache with correct borders:
// ID               symbol without borders
// ROAD_ID          symbol with solid borders
// VARATIE_ID       symbol with varatie borders
// DIVERSION_ID     symbol with diversion borders
function addSymbol(name: string, width: number, svg: string, id: string = name) {
    const tie_svg = svg + `\n<rect y="1" width="${width}" height="2"/>\n<rect y="29" width="${width}" height="2"/>`;
    const varatie_svg = svg + `\n<rect y="1" width="2" height="2"/>
    <rect x="5.6" y="1" width="4.8" height="2"/>
    <rect x="14" y="1" width="2" height="2"/>
    <rect y="29" width="2" height="2"/>
    <rect x="5.6" y="29" width="4.8" height="2"/>
    <rect x="14" y="29" width="2" height="2"/>`;
    const varareitti_svg = svg + `\n<path d="M1.006,3h2V1h-2Zm4,0h2V1h-2Zm4,0h2V1h-2Zm4-2V3h2V1Zm-12,30h2V29h-2Zm4,0h2V29h-2Zm4,0h2V29h-2Zm4,0h2V29h-2Z"/>`;

    SYMBOL_CACHE[id] = new Symbol(width, svg, name, id, false);
    SYMBOL_CACHE[BorderType.ROAD + id] = new Symbol(width, tie_svg, name, id, false);
    SYMBOL_CACHE[BorderType.DETOUR + id] = new Symbol(width, varatie_svg, name, id, false);
    SYMBOL_CACHE[BorderType.DIVERSION + id] = new Symbol(width, varareitti_svg, name, id, false);
}

function addEnd(name: string, width: number, svg: string, id: string) {
    SYMBOL_CACHE[id] = new Symbol(width, svg, name, id, true);
}

export function findSymbol(borderType: BorderType, name: string): Symbol {
    const symbolKey = name.includes('_') ? name.toUpperCase() : borderType.valueOf() + name.toUpperCase();
    return SYMBOL_CACHE[symbolKey];
}

export function isValidSymbol(symbol: string): boolean {
    return SYMBOL_CACHE[symbol.toUpperCase()];
}