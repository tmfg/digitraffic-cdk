import { convertTextToSvg } from "../../../lib/service/text-converter";

describe('text-converter-tests', () => {
    test('empty_errors', () => {
        expectError("");
        expectError("[]");
    });

    test('bracket_errors', () => {
        expectError("[");
        expectError("123[");
        expectError("[12]3");
    });

    test('wrong_characters', () => {
        expectError("123Z");
    });

    test('wrong_symbol', () => {
        expectError("temppu_123");
    });

    test('single_symbols', () => {
        expectValue("[1]", ["n1"]);
        expectValue("1", ["n1"]);
        expectValue("[A]", ["A"]);
        expectValue("a", ["A"]);
        expectError("[Z]");
        expectError("z");
    });

    test('tie1', () => {
        expectValue("[TIE_1]", ["BEGIN", "n1", "END"]);
        expectValue("TIE_1", ["BEGIN", "n1", "END"]);
    });

    test('varatie', () => {
        expectValue("[VARATIE_123]", ["BEGIN", "n1", "n2", "n3", "END"]);
        expectValue("VARATIE_123", ["BEGIN", "n1", "n2", "n3", "END"]);
        expectValue("varatie_123", ["BEGIN", "n1", "n2", "n3", "END"]);
    });

    test('varareitti', () => {
        expectValue("[VARAREITTI_123]", ["BEGIN", "n1", "n2", "n3","END"]);
        expectValue("[varareitti_123]", ["BEGIN", "n1", "n2", "n3","END"]);
        expectValue("varareitti_123", ["BEGIN", "n1", "n2", "n3","END"]);
    });

    test('ramppi_123', () => {
        expectValue("[RAMPPI_123]", ["RAMP", "n1", "n2", "n3", "END"]);
        expectValue("RAMPPI_123", ["RAMP", "n1", "n2", "n3", "END"]);
        expectValue("ramppi_123", ["RAMP", "n1", "n2", "n3", "END"]);
    });

    test('single_ramppi', () => {
        expectValue("RAMPPI", ["RAMP"]);
    });

    test('broken_texts', () => {
        expectError("[1VARAREITTI_123]");
        expectError("[VARAREITTI_VARAREITTI_123]");
        expectError("[VARAREITTI_VARATIE_123]");
    });

    test('single_harbour', () => {
        expectValue("LAIVA_VASEN", ["HARBOUR"]);
        expectValue("LAIVA_OIKEA", ["HARBOUR"]);
    });

    test('harbour_with_road', () => {
        expectError("TIE_LAIVA_VASEN");
    });

    test('single_airport', () => {
        expectValue("LENTOKONE_VASEN", ["AIRPORT"]);
        expectValue("LENTOKONE_OIKEA", ["AIRPORT"]);
        expectValue("LENTOKONE_ALAS", ["AIRPORT"]);
        expectValue("LENTOKONE_YLOS", ["AIRPORT"]);
    });

    test('nuoli', () => {
        expectValue('NUOLI_VASENYLOS', ['ARROW_TOP_LEFT']);
        expectValue('nuoli_oikea', ['ARROW_RIGHT']);
        expectError('NUOLI_VASENYYLOS');
    });

    function expectValue(text: string, elements: string[] = []) {
        const svg = convertTextToSvg(text);

        if (elements) expectElements(svg, elements);
    }

    function expectError(text: string, errorText = "") {
        expect(() => convertTextToSvg(text)).toThrow(errorText);
    }

    function expectElements(svg: string, elements: string[]) {
        const usedSymbols = findUsedSymbols(svg);

        //        console.info("symbols " + usedSymbols);
        //        console.info("expected " + elements);

        expect(usedSymbols.length).toEqual(elements.length);

        for (let i = 0;i < elements.length;i++) {
            expect(usedSymbols[i]).toEqual(elements[i]);
        }
    }

    function findUsedSymbols(svg: string): string[] {
        const lines = svg.split('\n').filter(l => l.startsWith("<use href"));

        return lines.map(l => {
            const i1 = l.indexOf("\"");
            const i2 = l.indexOf("\"", i1+1);

            return l.substring(i1 + 2, i2);
        });
    }
});