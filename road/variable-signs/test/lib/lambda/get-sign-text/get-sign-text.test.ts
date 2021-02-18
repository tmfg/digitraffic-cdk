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
        expectValue("[1]");
    });

    test('a_symbol', () => {
        expectValue("[A]");
    });

    test('z_symbol', () => {
        expectError("[Z]");
    });

    test('tie1_with_brackets', () => {
        expectValue("[TIE_1]");
    });

    test('tie1_without_brackets', () => {
        expectValue("TIE_1");
    });

    test('varatie', () => {
        expectValue("[VARATIE_123]");
    })

    test('varareitti', () => {
        expectValue("[VARAREITTI_123]");
    })

    test('ramppi', () => {
        expectValue("[RAMPPI_123]");
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

    function expectValue(text: string) {
        const svg = convertTextToSvg(text);

        console.info("svg " + svg);

        expect(svg);
    }

    function expectError(text: string, errorText: string = "") {
        expect(() => convertTextToSvg(text)).toThrow();
    }   

}); 