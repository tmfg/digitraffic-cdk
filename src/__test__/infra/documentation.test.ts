import { DocumentationPart } from "../../aws/infra/documentation.js";

const METHOD_NAME = "test" as const;
const SUMMARY = "summary" as const;
const PARAMETER_NAME = "parameter" as const;
const DESCRIPTION = "description" as const;
const DEPRECATION_NOTE = "note" as const;

describe("DocumentationPart tests", () => {
    test("method", () => {
        const part = DocumentationPart.method([], METHOD_NAME, SUMMARY);

        expect(part.type).toEqual("METHOD");
        expect(part.parameterName).toEqual(METHOD_NAME);
        expect(part.documentationProperties.summary).toEqual(SUMMARY);
        expect(part.documentationProperties.deprecated).toBeFalsy();
    });

    test("method - deprecated", () => {
        const part = DocumentationPart.method([], METHOD_NAME, SUMMARY).deprecated(DEPRECATION_NOTE);

        expect(part.type).toEqual("METHOD");
        expect(part.parameterName).toEqual(METHOD_NAME);
        expect(part.documentationProperties.summary).toEqual(`${SUMMARY}. ${DEPRECATION_NOTE}`);
        expect(part.documentationProperties.deprecated).toBeTruthy();
    });

    test("queryparameter", () => {
        const part = DocumentationPart.queryParameter(PARAMETER_NAME, DESCRIPTION);

        expect(part.type).toEqual("QUERY_PARAMETER");
        expect(part.parameterName).toEqual(PARAMETER_NAME);
        expect(part.documentationProperties.description).toEqual(DESCRIPTION);
        expect(part.documentationProperties.deprecated).toBeFalsy();
    });

    test("pathparameter", () => {
        const part = DocumentationPart.pathParameter(PARAMETER_NAME, DESCRIPTION);

        expect(part.type).toEqual("PATH_PARAMETER");
        expect(part.parameterName).toEqual(PARAMETER_NAME);
        expect(part.documentationProperties.description).toEqual(DESCRIPTION);
        expect(part.documentationProperties.deprecated).toBeFalsy();
    });
});
