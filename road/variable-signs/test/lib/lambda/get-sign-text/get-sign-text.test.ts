import { convertTextToSvg } from "../../../../lib/service/text-converter";

describe('text-converter-tests', () => {
    test('empty', () => {
        expectError("");
    });

    test('empty_with_brackets', () => {
        expectError("[]");
    });

    test('brackets_error_1', () => {
        expectError("[");
    });

    test('brackets_error_2', () => {
        expectError("123[");
    });

    test('brackets_error_3', () => {
        expectError("[12]3");
    });

    test('wrong_characters', () => {
        expectError("123Z");
    });

    test('1_symbol', () => {
        expectValue("[1]", ["n1"]);
    });

    test('a_symbol', () => {
        expectValue("[A]", ["A"]);
    });

    test('z_symbol', () => {
        expectError("[Z]");
    });

    test('tie1_with_brackets', () => {
        expectValue("[TIE_1]", ["BEGIN", "n1", "END"]);
    });

    test('tie1_without_brackets', () => {
        expectValue("TIE_1", ["BEGIN", "n1", "END"]);
    });

    test('varatie', () => {
        expectValue("[VARATIE_123]", ["BEGIN", "n1", "n2", "n3", "END"]);
    })

    test('varareitti', () => {
        expectValue("[VARAREITTI_123]", ["BEGIN", "n1", "n2", "n3","END"]);
    })

    test('ramppi_123', () => {
        expectValue("[RAMPPI_123]", ["RAMP", "n1", "n2", "n3", "END"]);
    })

    test('single_ramppi', () => {
        expectValue("RAMPPI", ["RAMP"]);
    })

    test('varareitti_broken', () => {
        expectError("[1VARAREITTI_123]");
    })

    test('varareitti_varareitti_broken', () => {
        expectError("[VARAREITTI_VARAREITTI_123]");
    })

    test('varareitti_varatie_broken', () => {
        expectError("[VARAREITTI_VARATIE_123]");
    })

   test('single_harbour', () => {
        expectValue("LAIVA_VASEN", ["HARBOUR"])
        expectValue("LAIVA_OIKEA", ["HARBOUR"])
    });

    test('harbour_with_road', () => {
       expectError("TIE_LAIVA_VASEN");
    });

    test('single_airport', () => {
        expectValue("LENTOKONE_VASEN", ["AIRPORT"])
        expectValue("LENTOKONE_OIKEA", ["AIRPORT"])
        expectValue("LENTOKONE_ALAS", ["AIRPORT"])
        expectValue("LENTOKONE_YLOS", ["AIRPORT"])
    })

    function expectValue(text: string, elements: string[] = []) {
        const svg = convertTextToSvg(text);

        if(elements) expectElements(svg, elements);
    }

    function expectError(text: string, errorText: string = "") {
        expect(() => convertTextToSvg(text)).toThrow(errorText);
    }   

    function expectElements(svg: string, elements: string[]) {
        const usedSymbols = findUsedSymbols(svg);

        console.info("symbols " + usedSymbols);

        expect(usedSymbols.length).toEqual(elements.length);

        for(let i = 0;i < elements.length;i++) {
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